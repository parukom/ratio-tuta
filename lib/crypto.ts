import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

/**
 * SECURITY: List of forbidden placeholder/example secrets
 * These values are commonly found in .env.example files and must never be used in production
 */
const FORBIDDEN_SECRET_VALUES = [
  'your-random-session-secret-here',
  'your-random-hmac-secret-here',
  'your-random-crypto-key-here',
  'your-random-cron-secret-here',
  'changeme',
  'change-me',
  'replace-me',
  'example',
  'test-secret',
  'dev-secret',
  'development-secret',
  'placeholder',
];

/**
 * SECURITY: Validate that a secret is not using forbidden/example values
 * Throws an error if the secret is unsafe
 */
function validateSecretSafety(secretName: string, secretValue: string): void {
  const lowerValue = secretValue.toLowerCase();

  // Check against forbidden values
  if (FORBIDDEN_SECRET_VALUES.some(forbidden => lowerValue.includes(forbidden))) {
    throw new Error(
      `[SECURITY CRITICAL] ${secretName} contains a forbidden placeholder value! ` +
      `Never use example values from .env.example in production. ` +
      `Generate a secure random secret with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }

  // Minimum length check (base64-encoded 32 bytes = 44 chars, but allow some flexibility)
  if (secretValue.length < 32) {
    throw new Error(
      `[SECURITY CRITICAL] ${secretName} is too short (${secretValue.length} chars). ` +
      `Secrets must be at least 32 characters for adequate entropy. ` +
      `Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }

  // Check for obvious weak patterns
  if (/^(.)\1+$/.test(secretValue)) {
    // All same character (e.g., "aaaaaaaa...")
    throw new Error(
      `[SECURITY CRITICAL] ${secretName} contains only repeated characters. ` +
      `Use a cryptographically random secret.`
    );
  }

  if (/^(012|123|abc|test|pass|admin)/i.test(secretValue)) {
    // Starts with common weak patterns
    throw new Error(
      `[SECURITY CRITICAL] ${secretName} starts with a common weak pattern. ` +
      `Use a cryptographically random secret.`
    );
  }
}

/**
 * SECURITY: Validate all critical environment secrets on startup
 * This prevents the application from running with dangerous default/example values
 */
export function validateEnvironmentSecrets(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const secretsToValidate = [
    { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET, required: true },
    { name: 'HMAC_SECRET', value: process.env.HMAC_SECRET, required: true },
    { name: 'CRYPTO_KEY', value: process.env.CRYPTO_KEY, required: true },
    { name: 'CRON_SECRET', value: process.env.CRON_SECRET, required: false }, // Optional
  ];

  const errors: string[] = [];

  for (const { name, value, required } of secretsToValidate) {
    if (!value) {
      if (required) {
        errors.push(`${name} is not set in environment variables`);
      }
      continue;
    }

    try {
      validateSecretSafety(name, value);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    const errorMessage = [
      '',
      '═══════════════════════════════════════════════════════════════',
      '  🚨 CRITICAL SECURITY CONFIGURATION ERROR 🚨',
      '═══════════════════════════════════════════════════════════════',
      '',
      ...errors.map(err => `  ❌ ${err}`),
      '',
      '📖 How to fix:',
      '  1. Generate secure random secrets:',
      '     node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
      '',
      '  2. Add them to your .env file:',
      '     SESSION_SECRET=<generated-value>',
      '     HMAC_SECRET=<generated-value>',
      '     CRYPTO_KEY=<generated-value>',
      '',
      '  3. Restart the application',
      '',
      '⚠️  NEVER commit .env files to version control!',
      '═══════════════════════════════════════════════════════════════',
      '',
    ].join('\n');

    // In production, fail hard (prevent startup)
    if (isProd) {
      throw new Error(errorMessage);
    }

    // In development, warn loudly but allow startup
    console.error(errorMessage);
  } else {
    console.log('[Security] ✅ All environment secrets validated successfully');
  }
}

// Normalizes emails for consistent hashing and comparison
export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function getHmacSecret(): Buffer {
  const val = process.env.HMAC_SECRET;
  if (!val) throw new Error('HMAC_SECRET is not set');

  // SECURITY: Validate on first use
  validateSecretSafety('HMAC_SECRET', val);

  // Prefer base64 if it decodes to at least 16 bytes; otherwise treat as utf-8
  const b64 = Buffer.from(val, 'base64');
  if (b64.length >= 16) return b64;
  return Buffer.from(val, 'utf-8');
}

function getCryptoKey(): Buffer {
  const val = process.env.CRYPTO_KEY;
  if (!val) throw new Error('CRYPTO_KEY is not set');

  // SECURITY: Validate on first use
  validateSecretSafety('CRYPTO_KEY', val);

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
