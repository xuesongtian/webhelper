import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

const ALGORITHM = "aes-256-gcm";

export function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported encrypted secret format.");
  }

  const [, iv, tag, encrypted] = parts;
  if (!iv || !tag || !encrypted) {
    throw new Error("Encrypted secret is incomplete.");
  }

  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]);

  return decrypted.toString("utf8");
}

export function randomWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

export function verifyGithubSignature(rawBody: Buffer, secret: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const actual = signatureHeader.trim();
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function encryptionKey(): Buffer {
  return createHash("sha256").update(config.encryptionKey).digest();
}
