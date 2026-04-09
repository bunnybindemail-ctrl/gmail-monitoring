import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getEnv } from "@/lib/env";

const IV_LENGTH = 12;

function getEncryptionKey() {
  const key = Buffer.from(getEnv().TOKEN_ENCRYPTION_KEY, "base64");

  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }

  return key;
}

export function encryptSecret(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    authTag.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string) {
  const [ivPart, ciphertextPart, authTagPart] = payload.split(".");

  if (!ivPart || !ciphertextPart || !authTagPart) {
    throw new Error("Encrypted payload is malformed.");
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivPart, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
