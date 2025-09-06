import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// Normalizes emails for consistent hashing and comparison
export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function getHmacSecret(): Buffer {
  const val = process.env.HMAC_SECRET;
  if (!val) throw new Error('HMAC_SECRET is not set');
  // Prefer base64 if it decodes to at least 16 bytes; otherwise treat as utf-8
  const b64 = Buffer.from(val, 'base64');
  if (b64.length >= 16) return b64;
  return Buffer.from(val, 'utf-8');
}

function getCryptoKey(): Buffer {
  const val = process.env.CRYPTO_KEY;
  if (!val) throw new Error('CRYPTO_KEY is not set');
  const b64 = Buffer.from(val, 'base64');
  if (b64.length === 32) return b64;
  const utf8 = Buffer.from(val, 'utf-8');
  if (utf8.length === 32) return utf8;
  throw new Error('CRYPTO_KEY must be 32 bytes (provide base64 or raw 32-byte value)');
}

// Returns hex string of HMAC-SHA256(normalizedEmail)
export function hmacEmail(email: string): string {
  const norm = normalizeEmail(email);
  const hmac = createHmac('sha256', getHmacSecret());
  hmac.update(norm);
  return hmac.digest('hex');
}

// Encrypts normalized email using AES-256-GCM. Format: v1:iv:ciphertext:tag (base64 fields)
export function encryptEmail(email: string): string {
  const plaintext = normalizeEmail(email);
  const key = getCryptoKey();
  const iv = randomBytes(12); // recommended IV length for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${enc.toString('base64')}:${tag.toString('base64')}`;
}

export function decryptEmail(payload: string): string {
  if (!payload) return '';
  const [ver, ivB64, ctB64, tagB64] = String(payload).split(':');
  if (ver !== 'v1' || !ivB64 || !ctB64 || !tagB64) {
    throw new Error('Invalid encrypted email payload');
  }
  const key = getCryptoKey();
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ct), decipher.final()]);
  return dec.toString('utf-8');
}

// Redact email for logs. If plaintext known, pass it; otherwise accept hmac to show prefix.
export function redactEmail(emailPlain?: string | null, emailHmacHex?: string | null): string {
  if (emailPlain) {
    const norm = normalizeEmail(emailPlain);
    const [user, domain] = norm.split('@');
    if (!domain) return '***';
    const shown = user ? `${user[0]}***` : '***';
    return `${shown}@${domain}`;
  }
  if (emailHmacHex) {
    return `hmac:${emailHmacHex.slice(0, 8)}…`;
  }
  return '***';
}
