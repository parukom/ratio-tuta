# 🔄 API Client Migration Guide

## Quick Reference

### Before (Old Way)
```typescript
const res = await fetch('/api/users/me', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Name' }),
});
const data = await res.json();
```

### After (New Way with CSRF)
```typescript
import { api } from '@/lib/api-client';

const data = await api.patch('/api/users/me', { name: 'New Name' });
```

---

## Migration Steps

### Step 1: Import API Client

```typescript
// Add this import
import { api } from '@/lib/api-client';

// Or for custom options
import { apiRequest } from '@/lib/api-client';
```

### Step 2: Replace fetch() calls

#### GET Requests
```typescript
// Before
const res = await fetch('/api/receipts');
const data = await res.json();

// After
const data = await api.get('/api/receipts');
```

#### POST Requests
```typescript
// Before
const res = await fetch('/api/receipts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ placeId, items }),
});
const data = await res.json();

// After
const data = await api.post('/api/receipts', { placeId, items });
```

#### PATCH Requests
```typescript
// Before
const res = await fetch(`/api/items/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated' }),
});
const data = await res.json();

// After
const data = await api.patch(`/api/items/${id}`, { name: 'Updated' });
```

#### DELETE Requests
```typescript
// Before
const res = await fetch(`/api/items/${id}`, {
  method: 'DELETE',
});
const data = await res.json();

// After
const data = await api.delete(`/api/items/${id}`);
```

### Step 3: Update Error Handling

```typescript
// Before
if (!res.ok) {
  const error = await res.json();
  throw new Error(error.message);
}

// After - errors are automatically thrown as ApiError
import { ApiError } from '@/lib/api-client';

try {
  const data = await api.post('/api/users/me', { name });
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.message);
  }
}
```

---

## Common Patterns

### Form Submission

```typescript
// Before
async function handleSubmit(e: FormEvent) {
  e.preventDefault();

  const res = await fetch('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const error = await res.json();
    setError(error.message);
    return;
  }

  const data = await res.json();
  onSuccess(data);
}

// After
import { api, ApiError } from '@/lib/api-client';

async function handleSubmit(e: FormEvent) {
  e.preventDefault();

  try {
    const data = await api.patch('/api/users/me', { name });
    onSuccess(data);
  } catch (error) {
    if (error instanceof ApiError) {
      setError(error.message);
    }
  }
}
```

### With Loading State

```typescript
import { api } from '@/lib/api-client';

const [loading, setLoading] = useState(false);

async function handleDelete() {
  setLoading(true);
  try {
    await api.delete(`/api/items/${id}`);
    onSuccess();
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

### With Custom Headers

```typescript
import { apiRequest } from '@/lib/api-client';

const data = await apiRequest('/api/users/me/avatar/upload', {
  method: 'POST',
  body: formData,
  headers: {
    // Don't set Content-Type for FormData - browser sets it
  },
});
```

---

## Files to Update

Based on grep results, these files need updating:

### Critical (Account/Auth)
- [ ] `/components/admin-zone/settings/user/sections/PersonalInformation.tsx`
- [ ] `/components/admin-zone/settings/user/sections/ChangePassword.tsx`
- [ ] `/components/admin-zone/settings/user/sections/DeleteAccount.tsx`
- [ ] `/components/admin-zone/settings/user/sections/LogoutOtherSessions.tsx`

### Team Management
- [ ] `/components/admin-zone/members/InviteMemberForm.tsx`
- [ ] `/components/admin-zone/members/TeamTable.tsx`

### Places
- [ ] `/components/admin-zone/places/CreatePlaceButton.tsx`
- [ ] `/components/admin-zone/places/DeletePlaceButton.tsx`
- [ ] `/components/admin-zone/PlaceSettings.tsx`
- [ ] `/components/admin-zone/Places.tsx`

### Items
- [ ] `/components/admin-zone/items/CreateItemButton.tsx`
- [ ] `/components/admin-zone/items/EditBoxModal.tsx`
- [ ] `/components/admin-zone/items/CreateItemOrBoxButton.tsx`

### Receipts
- [ ] (Need to find receipt creation components)

---

## Testing Checklist

After migration, test these flows:

- [ ] User profile update
- [ ] Email change
- [ ] Password change
- [ ] Account deletion
- [ ] Team member invitation
- [ ] Place creation/update/deletion
- [ ] Item creation/update/deletion
- [ ] Receipt creation

---

## Troubleshooting

### "Invalid CSRF token" errors

**Cause:** Token not being included in request

**Check:**
1. Are you using `api.*` methods or `apiRequest()`?
2. Is sessionStorage working in your browser?
3. Check Network tab - is `X-CSRF-Token` header present?

### Token fetch fails

**Cause:** `/api/csrf-token` endpoint not accessible

**Fix:**
1. Ensure endpoint is working: `curl http://localhost:3000/api/csrf-token`
2. Check session cookie is present
3. Verify CORS settings

### React hooks error

**Cause:** Using `useCsrfToken()` in server component

**Fix:**
```typescript
// Add 'use client' directive
'use client';

import { useCsrfToken } from '@/hooks/useCsrfToken';
```

---

## Complete Example

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api-client';

export function ProfileForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // CSRF token automatically included!
      const data = await api.patch('/api/users/me', {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
      });

      console.log('Success:', data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

---

*Auto-generated migration guide*
