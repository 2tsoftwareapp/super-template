import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export const encryptTotpSecret = (secret: Buffer, encryptionKeyHex: string): EncryptedSecret => {
  const key = Buffer.from(encryptionKeyHex, "hex");
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

export const decryptTotpSecret = (encrypted: EncryptedSecret, encryptionKeyHex: string): Buffer => {
  const key = Buffer.from(encryptionKeyHex, "hex");
  const iv = Buffer.from(encrypted.iv, "base64");
  const authTag = Buffer.from(encrypted.authTag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]);
};
