import type { DeploymentLog, Project } from "./api";

export const DEMO_PROJECT_ID = "demo-public";

export const demoProject: Project = {
  id: DEMO_PROJECT_ID,
  name: "Akeshen Studio",
  gitRepo: "github.com/akeshen/site-starter",
  branch: "main",
  domain: "demo.akeshen.com",
  status: "RUNNING",
  currentCommitHash: "d7e222c",
  lastDeployAt: "2026-05-13T10:40:00.000Z",
  visitUrl: "https://akeshen.com/login",
  createdAt: "2026-05-13T09:30:00.000Z",
  updatedAt: "2026-05-13T10:40:00.000Z",
  server: {
    host: "43.129.31.85",
    username: "ubuntu",
    sshPort: 22,
    authType: "PASSWORD_ONCE",
    status: "CONNECTED",
    lastCheckedAt: "2026-05-13T10:40:00.000Z",
    hasStoredPrivateKey: false,
  },
  envVars: [
    {
      id: "demo-env-1",
      key: "NEXT_PUBLIC_API_URL",
      value: "********",
      updatedAt: "2026-05-13T10:40:00.000Z",
    },
    {
      id: "demo-env-2",
      key: "DATABASE_URL",
      value: "********",
      updatedAt: "2026-05-13T10:40:00.000Z",
    },
  ],
  latestDeployment: {
    id: "demo-deploy-1",
    status: "SUCCESS",
    trigger: "manual",
    commitHash: "d7e222c",
    startedAt: "2026-05-13T10:34:00.000Z",
    finishedAt: "2026-05-13T10:40:00.000Z",
  },
  githubWebhook: {
    active: true,
    lastDeliveryAt: "2026-05-13T10:38:00.000Z",
    endpoint: `/webhooks/github/${DEMO_PROJECT_ID}`,
  },
};

export const demoProjects: Project[] = [demoProject];

export const demoLogs: DeploymentLog[] = [
  {
    id: "demo-log-1",
    projectId: DEMO_PROJECT_ID,
    deploymentId: "demo-deploy-1",
    level: "info",
    message: "Connected to ubuntu@43.129.31.85 without printing credentials.",
    createdAt: "2026-05-13T10:34:10.000Z",
  },
  {
    id: "demo-log-2",
    projectId: DEMO_PROJECT_ID,
    deploymentId: "demo-deploy-1",
    level: "info",
    message: "Docker and Docker Compose are ready.",
    createdAt: "2026-05-13T10:35:08.000Z",
  },
  {
    id: "demo-log-3",
    projectId: DEMO_PROJECT_ID,
    deploymentId: "demo-deploy-1",
    level: "success",
    message: "Caddy issued HTTPS certificate and routed traffic to web:3000.",
    createdAt: "2026-05-13T10:39:24.000Z",
  },
  {
    id: "demo-log-4",
    projectId: DEMO_PROJECT_ID,
    deploymentId: "demo-deploy-1",
    level: "success",
    message: "Health check passed: https://demo.akeshen.com responded with HTTP 200.",
    createdAt: "2026-05-13T10:40:00.000Z",
  },
];
