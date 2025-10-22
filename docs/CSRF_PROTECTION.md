# CSRF Protection Implementation

## Overview

This application uses **CSRF tokens** in addition to `SameSite=strict` cookies for defense-in-depth against Cross-Site Request Forgery attacks.

## Why Both SameSite and CSRF Tokens?

1. **SameSite=strict** - Primary defense, but:
   - Not supported by all browsers (legacy/corporate)
   - Can be bypassed in some edge cases (top-level navigation)

2. **CSRF Tokens** - Secondary defense:
   - Works in all browsers
   - Validates intent for state-changing operations
   - Standard security practice

## Client-Side Implementation

### 1. Fetch CSRF Token on App Load

```typescript
// app/providers/csrf-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

const CsrfContext = createContext<string | null>(null);

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  return (
    <CsrfContext.Provider value={csrfToken}>
      {children}
    </CsrfContext.Provider>
  );
}

export function useCsrf() {
  return useContext(CsrfContext);
}
```

### 2. Include Token in API Calls

```typescript
// lib/api.ts
import { useCsrf } from '@/app/providers/csrf-provider';

export function useApiClient() {
  const csrfToken = useCsrf();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || '')) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken || '',
      };
    }

    const response = await fetch(url, options);
    return response;
  };

  return { apiCall };
}
```

### 3. Usage Example

```typescript
// components/create-item-form.tsx
import { useApiClient } from '@/lib/api';

function CreateItemForm() {
  const { apiCall } = useApiClient();

  const handleSubmit = async (data: ItemData) => {
    const response = await apiCall('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // CSRF token is automatically included in X-CSRF-Token header
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Server-Side Implementation

### Protecting API Routes

```typescript
// Example: src/app/api/items/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { requireCsrfToken, CsrfError } from '@lib/csrf';

export async function POST(req: Request) {
  try {
    const session = await getSession();

    // Validate CSRF token for state-changing operation
    requireCsrfToken(req, session);

    // ... rest of handler
  } catch (error) {
    if (error instanceof CsrfError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}
```

### Conditional Protection

```typescript
import { requiresCsrfProtection } from '@lib/csrf';

export async function handler(req: Request) {
  const session = await getSession();

  // Only check CSRF for state-changing methods
  if (requiresCsrfProtection(req.method)) {
    requireCsrfToken(req, session);
  }

  // ... rest of handler
}
```

## Migration Strategy

### Phase 1: Add CSRF Support (Non-Breaking)

1. Deploy CSRF token endpoint (`/api/csrf-token`)
2. Update client to fetch and include tokens
3. Add CSRF validation to API routes (log failures, don't block)

```typescript
try {
  requireCsrfToken(req, session);
} catch (error) {
  console.warn('CSRF validation failed (migration mode):', error);
  // Continue anyway during migration
}
```

### Phase 2: Enforce CSRF (Breaking Change)

After confirming clients are sending tokens:

```typescript
try {
  requireCsrfToken(req, session);
} catch (error) {
  return NextResponse.json({ error: 'CSRF token required' }, { status: 403 });
}
```

## Testing

### Manual Testing

```bash
# Get CSRF token
TOKEN=$(curl -s http://localhost:3000/api/csrf-token \
  -H "Cookie: __Host-pecunia-session=..." \
  | jq -r '.csrfToken')

# Use token in request
curl -X POST http://localhost:3000/api/items \
  -H "Cookie: __Host-pecunia-session=..." \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","price":10}'
```

### Automated Testing

```typescript
// tests/csrf.test.ts
import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from '@lib/csrf';

describe('CSRF Protection', () => {
  const mockSession = {
    userId: 'user-123',
    name: 'Test User',
    role: 'USER' as const,
  };

  it('generates valid token', () => {
    const token = generateCsrfToken(mockSession);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it('validates correct token', () => {
    const token = generateCsrfToken(mockSession);
    expect(validateCsrfToken(token, mockSession)).toBe(true);
  });

  it('rejects tampered token', () => {
    const token = generateCsrfToken(mockSession);
    const tampered = token.replace(/.$/, 'X');
    expect(validateCsrfToken(tampered, mockSession)).toBe(false);
  });

  it('rejects token for different user', () => {
    const token = generateCsrfToken(mockSession);
    const otherSession = { ...mockSession, userId: 'other-user' };
    expect(validateCsrfToken(token, otherSession)).toBe(false);
  });
});
```

## Security Considerations

1. **Token Lifetime**: Tokens are tied to session, expire when session expires
2. **Token Uniqueness**: Each token generation uses fresh randomness
3. **Timing-Safe Comparison**: Uses `timingSafeEqual()` to prevent timing attacks
4. **No State Storage**: Tokens are cryptographically validated, no DB lookup needed
5. **HTTPS Only**: Cookies already require HTTPS via `__Host-` prefix

## Exemptions

Safe methods don't require CSRF protection:
- `GET` - Read-only
- `HEAD` - Metadata only
- `OPTIONS` - CORS preflight

## Troubleshooting

### "Invalid or missing CSRF token" Error

1. **Check session**: User must be logged in
2. **Check header**: Token must be in `X-CSRF-Token` header
3. **Check token format**: Should be `base64url.base64url`
4. **Check expiry**: Token expires with session (7 days default)

### CSRF Token Not Fetched

1. Check `/api/csrf-token` endpoint is accessible
2. Check session cookie is present
3. Check CORS headers allow credentials
4. Check browser console for errors

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
