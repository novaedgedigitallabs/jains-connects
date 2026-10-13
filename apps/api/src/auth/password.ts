import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const saltBytes = 16;
const keyBytes = 64;
const scryptOptions = { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };
const algorithm = 'scrypt-v1';

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyBytes, scryptOptions, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(saltBytes);
  const derivedKey = await deriveKey(password, salt);

  return [algorithm, salt.toString('base64url'), derivedKey.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [encodedAlgorithm, encodedSalt, encodedKey] = encodedHash.split('$');

  if (!encodedAlgorithm || !encodedSalt || !encodedKey || encodedAlgorithm !== algorithm) {
    return false;
  }

  try {
    const salt = Buffer.from(encodedSalt, 'base64url');
    const expectedKey = Buffer.from(encodedKey, 'base64url');
    const actualKey = await deriveKey(password, salt);

    return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
  } catch {
    return false;
  }
}
