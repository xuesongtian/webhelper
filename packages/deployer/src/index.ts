import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NodeSSH, type Config } from "node-ssh";

export type DeployLogger = (entry: {
  level: "info" | "warn" | "error" | "success";
  message: string;
}) => Promise<void> | void;

export type SshCredentials = {
  host: string;
  port?: number;
  username: string;
  privateKey?: string;
  passphrase?: string;
  password?: string;
};

export type DeployProjectInput = {
  projectId: string;
  name: string;
  gitRepo: string;
  branch: string;
  domain: string;
  envVars: Record<string, string>;
  ssh: SshCredentials;
};

export type DeployResult = {
  commitHash: string;
  projectType: "nextjs" | "node" | "static";
  url: string;
};

const DEFAULT_REMOTE_ROOT = "/opt/jianzhan-assistant";

export function redactSecrets(value: string, secrets: Array<string | undefined | null> = []): string {
  let output = value
    .replace(/-----BEGIN [\s\S]+?-----END [A-Z ]+-----/g, "[REDACTED_PRIVATE_KEY]")
    .replace(/(password|passphrase|token|secret|authorization)(=|:)\s*["']?[^"'\s]+/gi, "$1$2[REDACTED]")
    .replace(/https:\/\/([^:\s/]+):([^@\s/]+)@/gi, "https://$1:[REDACTED]@")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]");

  for (const secret of secrets) {
    if (secret && secret.length >= 4) {
      output = output.split(secret).join("[REDACTED]");
    }
  }

  return output;
}

export async function deployProject(
  input: DeployProjectInput,
  logger: DeployLogger = consoleLogger,
): Promise<DeployResult> {
  const ssh = new NodeSSH();
  const secrets = collectSecrets(input);
  const projectSlug = safeSlug(input.projectId);
  const remoteDir = `${DEFAULT_REMOTE_ROOT}/${projectSlug}`;

  try {
    await logger({ level: "info", message: `Connecting to ${input.ssh.username}@${input.ssh.host}:${input.ssh.port ?? 22}` });
    await ssh.connect(toSshConfig(input.ssh));
    await logger({ level: "success", message: "SSH connection established." });

    await run(ssh, `sudo mkdir -p ${quote(remoteDir)} && sudo chown -R ${quote(input.ssh.username)}:${quote(input.ssh.username)} ${quote(remoteDir)}`, logger, secrets);
    await ensureDocker(ssh, logger, secrets);
    await ensureGit(ssh, logger, secrets);
    await syncRepository(ssh, remoteDir, input, logger, secrets);

    const projectType = await detectProjectType(ssh, remoteDir, logger, secrets);
    await logger({ level: "info", message: `Detected project type: ${projectType}` });

    await ensureDockerfile(ssh, remoteDir, projectType, logger);
    await uploadRuntimeFiles(ssh, remoteDir, input, projectType, logger);
    await run(ssh, "docker compose build --pull", logger, secrets, remoteDir);
    await run(ssh, "docker compose up -d", logger, secrets, remoteDir);
    await run(ssh, "docker compose ps", logger, secrets, remoteDir);
    await run(ssh, "sudo ss -tulpn | grep -E ':80|:443' || true", logger, secrets);

    const commitHash = await getCommitHash(ssh, remoteDir, logger, secrets);
    await healthCheck(ssh, input.domain, logger, secrets);
    await logger({ level: "success", message: `Deployment finished at https://${input.domain}` });

    return { commitHash, projectType, url: `https://${input.domain}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logger({ level: "error", message: redactSecrets(message, secrets) });
    throw error;
  } finally {
    ssh.dispose();
  }
}

export async function stopRemoteProject(
  input: Pick<DeployProjectInput, "projectId" | "ssh">,
  logger: DeployLogger = consoleLogger,
): Promise<void> {
  const ssh = new NodeSSH();
  const secrets = collectSecrets({ ...input, name: "", gitRepo: "", branch: "", domain: "", envVars: {} });
  const remoteDir = `${DEFAULT_REMOTE_ROOT}/${safeSlug(input.projectId)}`;

  try {
    await logger({ level: "info", message: `Connecting to ${input.ssh.username}@${input.ssh.host}:${input.ssh.port ?? 22}` });
    await ssh.connect(toSshConfig(input.ssh));
    await run(ssh, `test -f ${quote(remoteDir)}/docker-compose.yml`, logger, secrets);
    await run(ssh, "docker compose stop", logger, secrets, remoteDir);
    await logger({ level: "success", message: "Remote containers stopped. Server files were left untouched." });
  } finally {
    ssh.dispose();
  }
}

function toSshConfig(credentials: SshCredentials): Config {
  const config: Config = {
    host: credentials.host,
    port: credentials.port ?? 22,
    username: credentials.username,
    readyTimeout: 30_000,
  };

  if (credentials.privateKey) {
    config.privateKey = credentials.privateKey;
  }

  if (credentials.passphrase) {
    config.passphrase = credentials.passphrase;
  }

  if (credentials.password) {
    config.password = credentials.password;
  }

  return config;
}

async function ensureDocker(
  ssh: NodeSSH,
  logger: DeployLogger,
  secrets: string[],
): Promise<void> {
  await run(
    ssh,
    "(command -v docker >/dev/null 2>&1) || (curl -fsSL https://get.docker.com | sudo sh)",
    logger,
    secrets,
  );
  await run(
    ssh,
    "(docker compose version >/dev/null 2>&1) || (sudo apt-get update && sudo apt-get install -y docker-compose-plugin)",
    logger,
    secrets,
  );
}

async function ensureGit(
  ssh: NodeSSH,
  logger: DeployLogger,
  secrets: string[],
): Promise<void> {
  await run(
    ssh,
    "(command -v git >/dev/null 2>&1) || (sudo apt-get update && sudo apt-get install -y git)",
    logger,
    secrets,
  );
}

async function syncRepository(
  ssh: NodeSSH,
  remoteDir: string,
  input: DeployProjectInput,
  logger: DeployLogger,
  secrets: string[],
): Promise<void> {
  const branch = quote(input.branch);
  const repo = quote(input.gitRepo);
  const command = [
    "if [ -d .git ]; then",
    `git fetch origin ${branch} && git checkout ${branch} && git pull --ff-only origin ${branch};`,
    "else",
    `git clone --branch ${branch} --depth=1 ${repo} . || git clone ${repo} .;`,
    "fi",
  ].join(" ");

  await run(ssh, command, logger, secrets, remoteDir);
}

async function detectProjectType(
  ssh: NodeSSH,
  remoteDir: string,
  logger: DeployLogger,
  secrets: string[],
): Promise<DeployResult["projectType"]> {
  const command = [
    "if [ -f package.json ] && grep -q '\"next\"' package.json; then echo nextjs;",
    "elif [ -f package.json ]; then echo node;",
    "else echo static;",
    "fi",
  ].join(" ");
  const result = await run(ssh, command, logger, secrets, remoteDir, { quiet: true });
  const detected = result.stdout.trim();

  if (detected === "nextjs" || detected === "node" || detected === "static") {
    return detected;
  }

  return "static";
}

async function ensureDockerfile(
  ssh: NodeSSH,
  remoteDir: string,
  projectType: DeployResult["projectType"],
  logger: DeployLogger,
): Promise<void> {
  const exists = await ssh.execCommand("test -f Dockerfile", { cwd: remoteDir });
  if (exists.code === 0) {
    await logger({ level: "info", message: "Existing Dockerfile found; using repository Dockerfile." });
    return;
  }

  const dockerfile = projectType === "static" ? staticDockerfile() : nodeDockerfile();
  await putTextFile(ssh, dockerfile, `${remoteDir}/Dockerfile`);
  await logger({ level: "info", message: "Generated a baseline Dockerfile for this project." });
}

async function uploadRuntimeFiles(
  ssh: NodeSSH,
  remoteDir: string,
  input: DeployProjectInput,
  projectType: DeployResult["projectType"],
  logger: DeployLogger,
): Promise<void> {
  const compose = dockerComposeYaml(projectType);
  const caddyfile = caddyfileForDomain(input.domain);
  const envFile = envFileFor(input.envVars);

  await putTextFile(ssh, compose, `${remoteDir}/docker-compose.yml`);
  await putTextFile(ssh, caddyfile, `${remoteDir}/Caddyfile`);
  await putTextFile(ssh, envFile, `${remoteDir}/.env.production`);
  await logger({ level: "info", message: "Uploaded docker-compose.yml, Caddyfile, and encrypted environment variables as a remote env file." });
}

async function getCommitHash(
  ssh: NodeSSH,
  remoteDir: string,
  logger: DeployLogger,
  secrets: string[],
): Promise<string> {
  const result = await run(ssh, "git rev-parse --short HEAD", logger, secrets, remoteDir, { quiet: true });
  return result.stdout.trim();
}

async function healthCheck(
  ssh: NodeSSH,
  domain: string,
  logger: DeployLogger,
  secrets: string[],
): Promise<void> {
  const quotedHttps = quote(`https://${domain}`);
  const quotedHttp = quote(`http://${domain}`);
  const command = `curl -kfsS --max-time 15 ${quotedHttps} >/dev/null || curl -fsS --max-time 15 ${quotedHttp} >/dev/null`;
  await run(ssh, command, logger, secrets);
}

async function run(
  ssh: NodeSSH,
  command: string,
  logger: DeployLogger,
  secrets: string[],
  cwd?: string,
  options: { quiet?: boolean } = {},
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  if (!options.quiet) {
    await logger({ level: "info", message: `$ ${redactSecrets(command, secrets)}` });
  }

  const result = await ssh.execCommand(command, cwd ? { cwd } : undefined);
  const stdout = redactSecrets(result.stdout, secrets).trim();
  const stderr = redactSecrets(result.stderr, secrets).trim();

  if (stdout && !options.quiet) {
    await logger({ level: "info", message: stdout });
  }

  if (stderr && !options.quiet) {
    await logger({ level: result.code === 0 ? "warn" : "error", message: stderr });
  }

  if (result.code !== 0) {
    throw new Error(`Remote command failed (${result.code}): ${redactSecrets(command, secrets)}${stderr ? `\n${stderr}` : ""}`);
  }

  return { stdout: result.stdout, stderr: result.stderr, code: result.code };
}

async function putTextFile(ssh: NodeSSH, contents: string, remotePath: string): Promise<void> {
  const tmpRoot = await mkdtemp(join(tmpdir(), "jianzhan-deploy-"));
  const localPath = join(tmpRoot, "upload.txt");

  try {
    await writeFile(localPath, contents, { mode: 0o600 });
    await ssh.putFile(localPath, remotePath);
  } finally {
    await rm(tmpRoot, { recursive: true, force: true });
  }
}

function nodeDockerfile(): string {
  return `FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN corepack enable \\
  && if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \\
     elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \\
     elif [ -f package-lock.json ]; then npm ci; \\
     else npm install; fi
COPY . .
RUN if grep -q '"build"' package.json; then \\
      if [ -f pnpm-lock.yaml ]; then pnpm run build; \\
      elif [ -f yarn.lock ]; then yarn build; \\
      else npm run build; fi; \\
    fi
EXPOSE 3000
CMD if grep -q '"start"' package.json; then \\
      if [ -f pnpm-lock.yaml ]; then pnpm run start; \\
      elif [ -f yarn.lock ]; then yarn start; \\
      else npm run start; fi; \\
    else node server.js; fi
`;
}

function staticDockerfile(): string {
  return `FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY . .
RUN printf '%s\\n' 'server { listen 3000; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 3000
`;
}

function dockerComposeYaml(_projectType: DeployResult["projectType"]): string {
  return `services:
  app:
    build: .
    restart: unless-stopped
    env_file:
      - .env.production
    expose:
      - "3000"

  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
`;
}

function caddyfileForDomain(domain: string): string {
  return `${domain} {
  encode gzip
  reverse_proxy app:3000
}
`;
}

function envFileFor(envVars: Record<string, string>): string {
  return Object.entries(envVars)
    .filter(([key]) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
    .map(([key, value]) => `${key}=${escapeEnvValue(value)}`)
    .join("\n")
    .concat("\n");
}

function escapeEnvValue(value: string): string {
  return JSON.stringify(value);
}

function quote(value: string | number): string {
  const raw = String(value);
  return `'${raw.replace(/'/g, "'\\''")}'`;
}

function safeSlug(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
}

function collectSecrets(input: DeployProjectInput): string[] {
  return [
    input.ssh.password,
    input.ssh.privateKey,
    input.ssh.passphrase,
    ...Object.values(input.envVars),
    extractGitCredential(input.gitRepo),
  ].filter((value): value is string => Boolean(value));
}

function extractGitCredential(gitRepo: string): string | undefined {
  const match = gitRepo.match(/^https:\/\/[^:\s/]+:([^@\s/]+)@/i);
  return match?.[1];
}

async function consoleLogger(entry: { level: string; message: string }): Promise<void> {
  const prefix = entry.level.toUpperCase();
  console.log(`[${prefix}] ${entry.message}`);
}
