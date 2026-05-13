"use client";

export type ProjectStatus = "UNDEPLOYED" | "BUILDING" | "RUNNING" | "FAILED" | "STOPPED";
export type DeploymentStatus = "QUEUED" | "BUILDING" | "RUNNING" | "FAILED" | "STOPPED" | "SUCCESS";
export type SshAuthType = "PRIVATE_KEY" | "PASSWORD_ONCE";

export type Project = {
  id: string;
  name: string;
  gitRepo: string;
  branch: string;
  domain: string;
  status: ProjectStatus;
  currentCommitHash: string | null;
  lastDeployAt: string | null;
  visitUrl: string;
  createdAt: string;
  updatedAt: string;
  server: {
    host: string;
    username: string;
    sshPort: number;
    authType: SshAuthType;
    status: "UNKNOWN" | "CONNECTING" | "CONNECTED" | "FAILED";
    lastCheckedAt: string | null;
    hasStoredPrivateKey: boolean;
  } | null;
  envVars: Array<{
    id: string;
    key: string;
    value: string;
    updatedAt: string;
  }>;
  latestDeployment: {
    id: string;
    status: DeploymentStatus;
    trigger: string;
    commitHash: string | null;
    startedAt: string;
    finishedAt: string | null;
  } | null;
  githubWebhook: {
    active: boolean;
    lastDeliveryAt: string | null;
    endpoint: string;
  } | null;
};

export type DeploymentLog = {
  id: string;
  projectId: string;
  deploymentId: string | null;
  level: "info" | "warn" | "error" | "success" | string;
  message: string;
  createdAt: string;
};

export type GuestMessage = {
  id: string;
  content: string;
  hasContact: boolean;
  createdAt: string;
};

export type ProjectFormPayload = {
  name: string;
  gitRepo: string;
  branch: string;
  domain: string;
  serverIp: string;
  sshUsername: string;
  sshPort: number;
  sshAuthType: SshAuthType;
  sshPrivateKey?: string;
  sshKeyPassphrase?: string;
  envVars: Array<{ key: string; value: string }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "jianzhan-assistant-token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(path: string, init: JsonRequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (response.status === 401) {
    clearToken();
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with ${response.status}`);
  }

  return data as T;
}

export function apiBaseUrl(): string {
  return API_BASE;
}
