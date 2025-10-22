/**
 * Password Strength Validation
 *
 * Implements NIST SP 800-63B guidelines:
 * - Minimum 8 characters (no arbitrary maximum)
 * - Check against common breached passwords
 * - No complexity requirements (just length + uniqueness)
 */

// Common breached passwords (top 100 most common)
// In production, use Have I Been Pwned API or larger dataset
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
  'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow', 'superman',
  '123123', 'password1', 'qazwsx', 'password123', 'welcome', 'admin',
  'login', 'admin123', 'root', 'test', 'pass', 'password12', '12341234',
  'secret', 'password!', '1q2w3e4r', 'asdf', 'zxcvbn', 'qwerty123',
]);

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    return { valid: false, errors, strength: 'weak' };
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password.');
    return { valid: false, errors, strength: 'weak' };
  }

  // Check for sequential characters (weak passwords like 'abcdefgh' or '12345678')
  if (hasSequentialChars(password)) {
    errors.push('Password contains too many sequential characters');
    return { valid: false, errors, strength: 'weak' };
  }

  // Check for repeated characters (weak passwords like 'aaaaaaaa')
  if (hasRepeatedChars(password)) {
    errors.push('Password contains too many repeated characters');
    return { valid: false, errors, strength: 'weak' };
  }

  // Calculate strength based on length and character diversity
  if (password.length >= 12 && hasCharacterDiversity(password)) {
    strength = 'strong';
  } else if (password.length >= 10) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Check for sequential characters (abc, 123, etc.)
 */
function hasSequentialChars(password: string): boolean {
  let sequentialCount = 0;
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i);
    const char2 = password.charCodeAt(i + 1);
    const char3 = password.charCodeAt(i + 2);

    if (char2 === char1 + 1 && char3 === char2 + 1) {
      sequentialCount++;
    }
  }
  return sequentialCount > 2; // Allow up to 2 sequences
}

/**
 * Check for repeated characters (aaa, 111, etc.)
 */
function hasRepeatedChars(password: string): boolean {
  const charCounts: Record<string, number> = {};
  for (const char of password) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }

  // Check if any character appears more than 40% of the time
  const maxRepeat = Math.max(...Object.values(charCounts));
  return maxRepeat > password.length * 0.4;
}

/**
 * Check character diversity (uppercase, lowercase, numbers, symbols)
 */
function hasCharacterDiversity(password: string): boolean {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  // At least 3 out of 4 types
  const diversityCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  return diversityCount >= 3;
}

/**
 * Generate a secure random password
 */
export async function generateSecurePassword(length: number = 16): Promise<string> {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  // ESLint fix: Use dynamic import instead of require
  const { randomInt } = await import('crypto');
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
}

/**
 * HIBP Configuration
 *
 * Set HIBP_FAIL_OPEN=true in .env to allow passwords when API is unavailable
 * Production default: fail closed (reject passwords if API fails)
 */
const HIBP_FAIL_OPEN = process.env.HIBP_FAIL_OPEN === 'true';

/**
 * Check password against Have I Been Pwned API
 *
 * Uses k-anonymity to check if password has been breached
 * without sending the full password to the API.
 *
 * SECURITY: By default, fails closed (rejects password if API unavailable).
 * Set HIBP_FAIL_OPEN=true to allow passwords when API fails (not recommended for production).
 *
 * @throws Error if API fails and HIBP_FAIL_OPEN is false
 */
export async function checkPwnedPassword(password: string): Promise<boolean> {
  try {
    // ESLint fix: Use import instead of require
    const { createHash } = await import('crypto');
    const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      if (HIBP_FAIL_OPEN) {
        console.warn(
          `[HIBP] API returned ${response.status}, allowing password (HIBP_FAIL_OPEN=true)`
        );
        return false;
      }

      throw new Error(
        `HIBP API returned ${response.status}. ` +
        'Set HIBP_FAIL_OPEN=true to allow passwords when API is unavailable.'
      );
    }

    const data = await response.text();
    const hashes = data.split('\n');

    for (const line of hashes) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix === suffix) {
        return true; // Password found in breach database
      }
    }

    return false; // Password not found in breaches
  } catch (error) {
    console.error('[HIBP] Failed to check password against HIBP:', error);

    if (HIBP_FAIL_OPEN) {
      console.warn('[HIBP] Allowing password (HIBP_FAIL_OPEN=true)');
      return false; // Fail open - allow the password
    }

    // Fail closed - reject the password
    throw new Error(
      'Unable to verify password security. Please try again later or contact support. ' +
      '(Password breach check service unavailable)'
    );
  }
}
