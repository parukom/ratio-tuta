/**
 * Request Size Validation Middleware
 *
 * Prevents DoS attacks through large payloads by:
 * - Checking Content-Length headers
 * - Validating JSON body sizes
 * - Setting per-endpoint size limits
 */

export const REQUEST_SIZE_LIMITS = {
  // Authentication endpoints (small payloads)
  AUTH_DEFAULT: 5 * 1024, // 5 KB (email, password, name)

  // Financial endpoints
  RECEIPT_CREATE: 100 * 1024, // 100 KB (receipts with many items)
  RECEIPT_UPDATE: 50 * 1024, // 50 KB

  // Item management
  ITEM_CREATE: 20 * 1024, // 20 KB (name, description, image URL)
  ITEM_UPDATE: 20 * 1024, // 20 KB

  // Team management
  TEAM_CREATE: 10 * 1024, // 10 KB
  TEAM_UPDATE: 10 * 1024, // 10 KB
  TEAM_MEMBER_ADD: 5 * 1024, // 5 KB

  // Place management
  PLACE_CREATE: 15 * 1024, // 15 KB
  PLACE_UPDATE: 15 * 1024, // 15 KB

  // Default for other endpoints
  DEFAULT: 10 * 1024, // 10 KB
} as const;

export interface RequestSizeResult {
  valid: boolean;
  error?: string;
  contentLength?: number;
  limit: number;
}

/**
 * Validate request size based on Content-Length header
 */
export function validateRequestSize(
  req: Request,
  limit: number = REQUEST_SIZE_LIMITS.DEFAULT
): RequestSizeResult {
  const contentLength = req.headers.get('content-length');

  if (!contentLength) {
    // No Content-Length header - could be chunked encoding
    // We'll rely on JSON parsing limits as fallback
    return {
      valid: true,
      limit,
    };
  }

  const size = parseInt(contentLength, 10);

  if (isNaN(size)) {
    return {
      valid: false,
      error: 'Invalid Content-Length header',
      limit,
    };
  }

  if (size > limit) {
    return {
      valid: false,
      error: `Request body too large. Maximum size: ${formatBytes(limit)}`,
      contentLength: size,
      limit,
    };
  }

  return {
    valid: true,
    contentLength: size,
    limit,
  };
}

/**
 * Validate JSON body size after parsing
 * Use this as a secondary check after validateRequestSize
 */
export function validateJSONSize(data: unknown, limit: number): RequestSizeResult {
  try {
    const jsonString = JSON.stringify(data);
    const size = Buffer.byteLength(jsonString, 'utf8');

    if (size > limit) {
      return {
        valid: false,
        error: `JSON body too large. Maximum size: ${formatBytes(limit)}`,
        contentLength: size,
        limit,
      };
    }

    return {
      valid: true,
      contentLength: size,
      limit,
    };
  } catch {
    // ESLint fix: removed unused variable 'e'
    return {
      valid: false,
      error: 'Invalid JSON data',
      limit,
    };
  }
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate specific fields for size limits
 * Useful for validating string lengths, array sizes, etc.
 */
export interface FieldLimits {
  maxStringLength?: number;
  maxArrayLength?: number;
  maxObjectKeys?: number;
}

export function validateFieldSizes(
  data: Record<string, unknown>,
  limits: Record<string, FieldLimits>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, fieldLimits] of Object.entries(limits)) {
    const value = data[field];

    if (value === undefined || value === null) {
      continue; // Skip missing fields
    }

    // Validate string length
    if (typeof value === 'string' && fieldLimits.maxStringLength !== undefined) {
      if (value.length > fieldLimits.maxStringLength) {
        errors.push(
          `Field '${field}' exceeds maximum length of ${fieldLimits.maxStringLength} characters`
        );
      }
    }

    // Validate array length
    if (Array.isArray(value) && fieldLimits.maxArrayLength !== undefined) {
      if (value.length > fieldLimits.maxArrayLength) {
        errors.push(
          `Field '${field}' exceeds maximum array length of ${fieldLimits.maxArrayLength} items`
        );
      }
    }

    // Validate object keys
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      fieldLimits.maxObjectKeys !== undefined
    ) {
      const keyCount = Object.keys(value).length;
      if (keyCount > fieldLimits.maxObjectKeys) {
        errors.push(
          `Field '${field}' exceeds maximum of ${fieldLimits.maxObjectKeys} keys`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Common field limits for the application
 */
export const FIELD_LIMITS = {
  // User fields
  USER_NAME: { maxStringLength: 100 },
  USER_EMAIL: { maxStringLength: 255 },
  USER_PASSWORD: { maxStringLength: 128 }, // Bcrypt has practical limits

  // Team fields
  TEAM_NAME: { maxStringLength: 100 },
  TEAM_DESCRIPTION: { maxStringLength: 500 },

  // Item fields
  ITEM_NAME: { maxStringLength: 200 },
  ITEM_DESCRIPTION: { maxStringLength: 1000 },
  ITEM_SKU: { maxStringLength: 100 },

  // Place fields
  PLACE_NAME: { maxStringLength: 200 },
  PLACE_ADDRESS: { maxStringLength: 500 },

  // Receipt fields
  RECEIPT_ITEMS: { maxArrayLength: 100 }, // Max 100 items per receipt
  RECEIPT_NOTES: { maxStringLength: 1000 },

  // Package fields
  PACKAGE_NAME: { maxStringLength: 100 },
  PACKAGE_FEATURES: { maxArrayLength: 50 },
} as const;
