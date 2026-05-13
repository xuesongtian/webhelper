import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: "../../.env" });

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me-jwt-secret",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "dev-only-change-me-encryption-key",
};

export function isUsingDevelopmentSecrets(): boolean {
  return !process.env.JWT_SECRET || !process.env.ENCRYPTION_KEY;
}
