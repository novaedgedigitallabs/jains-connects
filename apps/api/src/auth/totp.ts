/**
 * RFC 6238 TOTP (SHA-1, 30-second step, 6 digits) with RFC 4648 base32
 * secrets, implemented on Node's crypto primitives so that MFA does not
 * depend on an external provider.
 *
 * Verification allows a ±1 step clock window. Comparisons use
 * timingSafeEqual to avoid code-guessing timing oracles.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
export const TOTP_VERIFY_WINDOW_STEPS = 1;

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(encoded: string): Uint8Array {
  const clean = encoded.replace(/=+$/g, '').toUpperCase().replace(/\s+/g, '');

  if (clean.length === 0) {
    throw new Error('Empty base32 value');
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);

    if (index === -1) {
      throw new Error('Invalid base32 character');
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Uint8Array.from(bytes);
}

export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(randomBytes(byteLength));
}

/** HOTP value (RFC 4226) for an 8-byte big-endian counter. */
function hotp(secret: Uint8Array, counter: number): string {
  const message = new Uint8Array(8);

  let remaining = counter;
  for (let offset = 7; offset >= 0; offset -= 1) {
    message[offset] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }

  const digest = createHmac('sha1', secret).update(message).digest();
  const truncationOffset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[truncationOffset] & 0x7f) << 24) |
    ((digest[truncationOffset + 1] & 0xff) << 16) |
    ((digest[truncationOffset + 2] & 0xff) << 8) |
    (digest[truncationOffset + 3] & 0xff);

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
}

export type TotpVerificationOptions = {
  nowMs?: number;
  stepSeconds?: number;
  windowSteps?: number;
};

export function verifyTotp(base32Secret: string, code: string, options: TotpVerificationOptions = {}): boolean {
  const normalizedCode = code.replace(/\s+/g, '');

  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  let secret: Uint8Array;

  try {
    secret = base32Decode(base32Secret);
  } catch {
    return false;
  }

  const stepSeconds = options.stepSeconds ?? TOTP_STEP_SECONDS;
  const windowSteps = options.windowSteps ?? TOTP_VERIFY_WINDOW_STEPS;
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  const currentCounter = Math.floor(nowSeconds / stepSeconds);

  for (let offset = -windowSteps; offset <= windowSteps; offset += 1) {
    const candidate = hotp(secret, currentCounter + offset);
    const candidateBytes = Buffer.from(candidate, 'utf8');
    const providedBytes = Buffer.from(normalizedCode, 'utf8');

    if (candidateBytes.length === providedBytes.length && timingSafeEqual(candidateBytes, providedBytes)) {
      return true;
    }
  }

  return false;
}

export function buildOtpauthUri(input: { label: string; issuer: string; secret: string }): string {
  const params = new URLSearchParams({
    secret: input.secret,
    issuer: input.issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(input.issuer)}:${encodeURIComponent(input.label)}?${params.toString()}`;
}

/**
 * Generates single-use MFA recovery codes. Codes are 128-bit random values
 * rendered in base32 groups; only their SHA-256 hash may be persisted.
 */
export function generateRecoveryCodes(count = 10): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    const raw = base32Encode(randomBytes(10)); // 80 bits → 16 base32 chars
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`);
  }

  return [...codes];
}
