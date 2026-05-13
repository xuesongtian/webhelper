import bcrypt from "bcryptjs";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import {
  DeploymentStatus,
  Prisma,
  ProjectStatus,
  ServerStatus,
  SshAuthType,
  type Deployment,
  type EnvVar,
  type GithubWebhook,
  type GuestMessage,
  type Project,
  type Server,
} from "@prisma/client";
import { deployProject, redactSecrets, stopRemoteProject, type DeployLogger } from "@jianzhan/deployer";
import { z } from "zod";
import { requireAuth, signAuthToken, type AuthRequest } from "./auth.js";
import { config, isUsingDevelopmentSecrets } from "./config.js";
import { decryptSecret, encryptSecret, randomWebhookSecret, verifyGithubSignature } from "./crypto.js";
import { prisma } from "./db.js";

type ProjectWithRelations = Project & {
  server: Server | null;
  envVars: EnvVar[];
  deployments: Deployment[];
  githubWebhook: GithubWebhook | null;
};

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const app = express();

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);
app.use(cors({ origin: config.corsOrigin, credentials: true }));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(60).optional(),
});

const envVarSchema = z.object({
  key: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Environment variable keys must be shell-safe."),
  value: z.string(),
});

const projectCreateSchema = z.object({
  name: z.string().min(2).max(80),
  gitRepo: z.string().min(3).max(500),
  branch: z.string().min(1).max(120).default("main"),
  domain: z.string().min(3).max(255),
  serverIp: z.string().min(3).max(255),
  sshUsername: z.string().min(1).max(80),
  sshPort: z.coerce.number().int().min(1).max(65535).default(22),
  sshAuthType: z.nativeEnum(SshAuthType).default(SshAuthType.PASSWORD_ONCE),
  sshPrivateKey: z.string().optional(),
  sshKeyPassphrase: z.string().optional(),
  envVars: z.array(envVarSchema).default([]),
});

const projectUpdateSchema = projectCreateSchema
  .partial()
  .extend({
    deleteMissingEnvVars: z.boolean().default(false),
  });

const deployRequestSchema = z.object({
  sshPassword: z.string().optional(),
  sshPrivateKey: z.string().optional(),
  sshKeyPassphrase: z.string().optional(),
});

const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(40).default(20),
});

const messageCreateSchema = z.object({
  content: z.string().trim().min(2).max(300),
  contact: z.string().trim().max(120).default(""),
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "jianzhan-assistant-api" });
});

app.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const normalizedEmail = body.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user && normalizedEmail === "demo@local.dev" && body.password === "password123") {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: "Demo User",
          passwordHash: await bcrypt.hash(body.password, 10),
        },
      });
    }

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    res.json({
      token: signAuthToken({ id: user.id, email: user.email }),
      user: { id: user.id, email: user.email, name: user.name },
    });
  }),
);

app.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const normalizedEmail = body.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ error: "Account already exists. Please sign in instead." });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: body.name ?? normalizedEmail.split("@")[0],
        passwordHash: await bcrypt.hash(body.password, 10),
      },
    });

    res.status(201).json({
      token: signAuthToken({ id: user.id, email: user.email }),
      user: { id: user.id, email: user.email, name: user.name },
    });
  }),
);

app.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const query = messageListQuerySchema.parse(req.query);
    const messages = await prisma.guestMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });

    res.json({ messages: messages.map(toPublicMessage) });
  }),
);

app.post(
  "/messages",
  asyncHandler(async (req, res) => {
    const body = messageCreateSchema.parse(req.body);
    const contact = body.contact.trim();
    const message = await prisma.guestMessage.create({
      data: {
        content: body.content,
        encryptedContact: contact ? encryptSecret(contact) : undefined,
      },
    });

    res.status(201).json({ message: toPublicMessage(message) });
  }),
);

app.get(
  "/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthRequest).user;
    const projects = await prisma.project.findMany({
      where: { userId: auth.id },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });

    res.json({ projects: projects.map(toPublicProject) });
  }),
);

app.post(
  "/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthRequest).user;
    const body = projectCreateSchema.parse(req.body);
    const webhookSecret = randomWebhookSecret();

    const project = await prisma.project.create({
      data: {
        userId: auth.id,
        name: body.name,
        gitRepo: body.gitRepo,
        branch: body.branch,
        domain: body.domain,
        server: {
          create: {
            host: body.serverIp,
            username: body.sshUsername,
            sshPort: body.sshPort,
            authType: body.sshPrivateKey ? SshAuthType.PRIVATE_KEY : body.sshAuthType,
            encryptedPrivateKey: body.sshPrivateKey ? encryptSecret(body.sshPrivateKey) : undefined,
            encryptedKeyPassphrase: body.sshKeyPassphrase ? encryptSecret(body.sshKeyPassphrase) : undefined,
          },
        },
        envVars: {
          create: body.envVars.map((envVar) => ({
            key: envVar.key,
            encryptedValue: encryptSecret(envVar.value),
          })),
        },
        githubWebhook: {
          create: {
            encryptedSecret: encryptSecret(webhookSecret),
          },
        },
      },
      include: projectInclude,
    });

    await appendProjectLog(project.id, null, "info", "Project created. Password-based SSH credentials were not stored.");
    res.status(201).json({ project: toPublicProject(project), webhookSecret });
  }),
);

app.get(
  "/projects/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await getOwnedProject(req);
    res.json({ project: toPublicProject(project) });
  }),
);

app.put(
  "/projects/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthRequest).user;
    const existing = await getOwnedProject(req);
    const body = projectUpdateSchema.parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      if (body.envVars) {
        await updateEnvVars(tx, existing.id, body.envVars, body.deleteMissingEnvVars);
      }

      await tx.project.update({
        where: { id: existing.id },
        data: {
          name: body.name,
          gitRepo: body.gitRepo,
          branch: body.branch,
          domain: body.domain,
        },
      });

      if (body.serverIp || body.sshUsername || body.sshPort || body.sshAuthType || body.sshPrivateKey || body.sshKeyPassphrase) {
        await tx.server.upsert({
          where: { projectId: existing.id },
          create: {
            projectId: existing.id,
            host: body.serverIp ?? existing.server?.host ?? "",
            username: body.sshUsername ?? existing.server?.username ?? "root",
            sshPort: body.sshPort ?? existing.server?.sshPort ?? 22,
            authType: body.sshPrivateKey ? SshAuthType.PRIVATE_KEY : body.sshAuthType ?? existing.server?.authType ?? SshAuthType.PASSWORD_ONCE,
            encryptedPrivateKey: body.sshPrivateKey ? encryptSecret(body.sshPrivateKey) : existing.server?.encryptedPrivateKey,
            encryptedKeyPassphrase: body.sshKeyPassphrase ? encryptSecret(body.sshKeyPassphrase) : existing.server?.encryptedKeyPassphrase,
          },
          update: {
            host: body.serverIp,
            username: body.sshUsername,
            sshPort: body.sshPort,
            authType: body.sshPrivateKey ? SshAuthType.PRIVATE_KEY : body.sshAuthType,
            encryptedPrivateKey: body.sshPrivateKey ? encryptSecret(body.sshPrivateKey) : undefined,
            encryptedKeyPassphrase: body.sshKeyPassphrase ? encryptSecret(body.sshKeyPassphrase) : undefined,
          },
        });
      }

      return tx.project.findUniqueOrThrow({
        where: { id: existing.id, userId: auth.id },
        include: projectInclude,
      });
    });

    res.json({ project: toPublicProject(updated) });
  }),
);

app.delete(
  "/projects/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await getOwnedProject(req);
    await prisma.project.delete({ where: { id: project.id } });
    res.json({ ok: true, message: "Project removed from dashboard only. Remote server files were not deleted." });
  }),
);

app.post(
  "/projects/:id/deploy",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await getOwnedProject(req);
    const body = deployRequestSchema.parse(req.body);
    const deployment = await createDeployment(project.id, "manual");

    void executeDeployment(project.id, deployment.id, "manual", body);
    res.status(202).json({ deploymentId: deployment.id, status: DeploymentStatus.QUEUED });
  }),
);

app.post(
  "/projects/:id/redeploy",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await getOwnedProject(req);
    const body = deployRequestSchema.parse(req.body);
    const deployment = await createDeployment(project.id, "redeploy");

    void executeDeployment(project.id, deployment.id, "redeploy", body);
    res.status(202).json({ deploymentId: deployment.id, status: DeploymentStatus.QUEUED });
  }),
);

app.post(
  "/projects/:id/stop",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await getOwnedProject(req);
    const body = deployRequestSchema.parse(req.body);
    const deployment = await createDeployment(project.id, "stop");

    void executeStop(project.id, deployment.id, body);
    res.status(202).json({ deploymentId: deployment.id, status: DeploymentStatus.QUEUED });
  }),
);

app.get(
  "/projects/:id/logs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await getOwnedProject(req);
    const logs = await prisma.deploymentLog.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    res.json({ logs });
  }),
);

app.get(
  "/projects/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await getOwnedProject(req);
    const latestDeployment = project.deployments[0] ?? null;

    res.json({
      status: {
        projectId: project.id,
        projectStatus: project.status,
        serverStatus: project.server?.status ?? ServerStatus.UNKNOWN,
        domain: project.domain,
        visitUrl: `https://${project.domain}`,
        currentCommitHash: project.currentCommitHash,
        lastDeployAt: project.lastDeployAt,
        latestDeployment,
      },
    });
  }),
);

app.post(
  "/webhooks/github/:projectId",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: projectInclude,
    });

    if (!project?.githubWebhook?.active) {
      res.status(404).json({ error: "Webhook target not found." });
      return;
    }

    const secret = decryptSecret(project.githubWebhook.encryptedSecret);
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));

    if (!secret || !verifyGithubSignature(rawBody, secret, req.header("x-hub-signature-256") ?? undefined)) {
      res.status(401).json({ error: "Invalid GitHub webhook signature." });
      return;
    }

    await prisma.githubWebhook.update({
      where: { projectId: project.id },
      data: { lastDeliveryAt: new Date() },
    });

    if (req.header("x-github-event") !== "push") {
      res.json({ ok: true, ignored: true });
      return;
    }

    const deployment = await createDeployment(project.id, "github-webhook");
    void executeDeployment(project.id, deployment.id, "github-webhook", {});
    res.status(202).json({ ok: true, deploymentId: deployment.id });
  }),
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Validation failed.", details: error.flatten() });
    return;
  }

  if (isHttpError(error)) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
  if (isUsingDevelopmentSecrets()) {
    console.warn("Development JWT/encryption secrets are in use. Set JWT_SECRET and ENCRYPTION_KEY before production.");
  }
});

function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

const projectInclude = {
  server: true,
  envVars: { orderBy: { key: "asc" as const } },
  deployments: { orderBy: { startedAt: "desc" as const }, take: 1 },
  githubWebhook: true,
} satisfies Prisma.ProjectInclude;

async function getOwnedProject(req: Request): Promise<ProjectWithRelations> {
  const auth = (req as AuthRequest).user;
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: auth.id },
    include: projectInclude,
  });

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  return project;
}

function toPublicProject(project: ProjectWithRelations) {
  return {
    id: project.id,
    name: project.name,
    gitRepo: redactSecrets(project.gitRepo),
    branch: project.branch,
    domain: project.domain,
    status: project.status,
    currentCommitHash: project.currentCommitHash,
    lastDeployAt: project.lastDeployAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    visitUrl: `https://${project.domain}`,
    server: project.server
      ? {
          host: project.server.host,
          username: project.server.username,
          sshPort: project.server.sshPort,
          authType: project.server.authType,
          status: project.server.status,
          lastCheckedAt: project.server.lastCheckedAt,
          hasStoredPrivateKey: Boolean(project.server.encryptedPrivateKey),
        }
      : null,
    envVars: project.envVars.map((envVar) => ({
      id: envVar.id,
      key: envVar.key,
      value: "********",
      updatedAt: envVar.updatedAt,
    })),
    latestDeployment: project.deployments[0] ?? null,
    githubWebhook: project.githubWebhook
      ? {
          active: project.githubWebhook.active,
          lastDeliveryAt: project.githubWebhook.lastDeliveryAt,
          endpoint: `/webhooks/github/${project.id}`,
        }
      : null,
  };
}

function toPublicMessage(message: GuestMessage) {
  return {
    id: message.id,
    content: redactSecrets(message.content),
    hasContact: Boolean(message.encryptedContact),
    createdAt: message.createdAt,
  };
}

async function updateEnvVars(
  tx: Prisma.TransactionClient,
  projectId: string,
  envVars: Array<z.infer<typeof envVarSchema>>,
  deleteMissing: boolean,
): Promise<void> {
  const existing = await tx.envVar.findMany({ where: { projectId } });
  const incomingKeys = new Set(envVars.map((envVar) => envVar.key));

  if (deleteMissing) {
    await tx.envVar.deleteMany({
      where: {
        projectId,
        key: { notIn: [...incomingKeys] },
      },
    });
  }

  for (const envVar of envVars) {
    const alreadyExists = existing.some((item) => item.key === envVar.key);
    if (!envVar.value && !alreadyExists) {
      continue;
    }

    await tx.envVar.upsert({
      where: { projectId_key: { projectId, key: envVar.key } },
      create: { projectId, key: envVar.key, encryptedValue: encryptSecret(envVar.value) },
      update: envVar.value ? { encryptedValue: encryptSecret(envVar.value) } : {},
    });
  }
}

async function createDeployment(projectId: string, trigger: string): Promise<Deployment> {
  return prisma.$transaction(async (tx) => {
    const deployment = await tx.deployment.create({
      data: { projectId, trigger, status: DeploymentStatus.QUEUED },
    });
    await tx.deploymentLog.create({
      data: {
        projectId,
        deploymentId: deployment.id,
        level: "info",
        message: `Deployment queued by ${trigger}.`,
      },
    });
    await tx.project.update({ where: { id: projectId }, data: { status: ProjectStatus.BUILDING } });
    return deployment;
  });
}

async function executeDeployment(
  projectId: string,
  deploymentId: string,
  trigger: string,
  credentials: z.infer<typeof deployRequestSchema>,
): Promise<void> {
  await prisma.deployment.update({ where: { id: deploymentId }, data: { status: DeploymentStatus.BUILDING } });

  const logger = projectLogger(projectId, deploymentId);
  try {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });

    const input = await toDeployInput(project, credentials);
    await prisma.server.update({
      where: { projectId },
      data: { status: ServerStatus.CONNECTING, lastCheckedAt: new Date() },
    });

    const result = await deployProject(input, logger);

    await prisma.$transaction([
      prisma.server.update({
        where: { projectId },
        data: { status: ServerStatus.CONNECTED, lastCheckedAt: new Date() },
      }),
      prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.SUCCESS,
          commitHash: result.commitHash,
          finishedAt: new Date(),
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.RUNNING,
          currentCommitHash: result.commitHash,
          lastDeployAt: new Date(),
        },
      }),
    ]);

    await appendProjectLog(projectId, deploymentId, "success", `Deployment ${trigger} completed at ${result.url}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markDeploymentFailed(projectId, deploymentId, message);
  }
}

async function executeStop(
  projectId: string,
  deploymentId: string,
  credentials: z.infer<typeof deployRequestSchema>,
): Promise<void> {
  await prisma.deployment.update({ where: { id: deploymentId }, data: { status: DeploymentStatus.BUILDING } });

  try {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });
    const input = await toDeployInput(project, credentials);
    await stopRemoteProject({ projectId, ssh: input.ssh }, projectLogger(projectId, deploymentId));

    await prisma.$transaction([
      prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.STOPPED, finishedAt: new Date() },
      }),
      prisma.project.update({ where: { id: projectId }, data: { status: ProjectStatus.STOPPED } }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markDeploymentFailed(projectId, deploymentId, message);
  }
}

async function toDeployInput(
  project: ProjectWithRelations,
  credentials: z.infer<typeof deployRequestSchema>,
) {
  if (!project.server) {
    throw new Error("Project server is not configured.");
  }

  const storedPrivateKey = decryptSecret(project.server.encryptedPrivateKey);
  const storedPassphrase = decryptSecret(project.server.encryptedKeyPassphrase);
  const privateKey = credentials.sshPrivateKey ?? storedPrivateKey;
  const passphrase = credentials.sshKeyPassphrase ?? storedPassphrase;

  if (!privateKey && !credentials.sshPassword) {
    throw new Error("Missing SSH credential. Provide a one-time password or save an encrypted private key.");
  }

  return {
    projectId: project.id,
    name: project.name,
    gitRepo: project.gitRepo,
    branch: project.branch,
    domain: project.domain,
    envVars: Object.fromEntries(
      project.envVars.map((envVar) => [envVar.key, decryptSecret(envVar.encryptedValue) ?? ""]),
    ),
    ssh: {
      host: project.server.host,
      port: project.server.sshPort,
      username: project.server.username,
      privateKey,
      passphrase,
      password: credentials.sshPassword,
    },
  };
}

function projectLogger(projectId: string, deploymentId: string): DeployLogger {
  return async (entry) => {
    await appendProjectLog(projectId, deploymentId, entry.level, entry.message);
  };
}

async function appendProjectLog(
  projectId: string,
  deploymentId: string | null,
  level: string,
  message: string,
): Promise<void> {
  await prisma.deploymentLog.create({
    data: {
      projectId,
      deploymentId,
      level,
      message: redactSecrets(message).slice(0, 10_000),
    },
  });
}

async function markDeploymentFailed(projectId: string, deploymentId: string, message: string): Promise<void> {
  await prisma.$transaction([
    prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.FAILED, finishedAt: new Date() },
    }),
    prisma.project.update({ where: { id: projectId }, data: { status: ProjectStatus.FAILED } }),
    prisma.server.updateMany({
      where: { projectId },
      data: { status: ServerStatus.FAILED, lastCheckedAt: new Date() },
    }),
    prisma.deploymentLog.create({
      data: {
        projectId,
        deploymentId,
        level: "error",
        message: redactSecrets(message).slice(0, 10_000),
      },
    }),
  ]);
}

function httpError(status: number, message: string): Error & { status?: number } {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function isHttpError(error: unknown): error is Error & { status: number } {
  return error instanceof Error && "status" in error && typeof (error as { status?: unknown }).status === "number";
}
