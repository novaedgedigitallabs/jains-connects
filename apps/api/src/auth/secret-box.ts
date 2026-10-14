/**
 * AES-256-GCM encryption for MFA shared secrets at rest. The key comes from
 * MFA_ENCRYPTION_KEY (base64, 32 bytes). Only ciphertext, IV, and auth tag
 * are ever persisted; the plaintext secret never touches the database or
 * logs.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type EncryptedSecret = {
  cipher: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
};

export function encodeEncryptionKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64');

  if (key.length !== 32) {
    throw new Error('MFA_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }

  return key;
}

export function encryptSecret(key: Buffer, plaintext: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    cipher: new Uint8Array(encrypted),
    iv: new Uint8Array(iv),
    tag: new Uint8Array(cipher.getAuthTag()),
  };
}

export function decryptSecret(key: Buffer, encrypted: EncryptedSecret): string {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.iv));
  decipher.setAuthTag(Buffer.from(encrypted.tag));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.cipher)),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
