# 🔧 CSRF UI Migration - Remaining Work

## ✅ Completed (9 files)

1. ✅ **src/app/auth/page.tsx** - Login & Registration (with skipCsrf for public endpoints)
2. ✅ **src/lib/api-client.ts** - Enhanced with FormData support
3. ✅ **src/components/admin-zone/settings/user/sections/DeleteAccount.tsx**
4. ✅ **src/components/admin-zone/settings/user/sections/PersonalInformation.tsx**
5. ✅ **src/components/admin-zone/settings/user/sections/ChangePassword.tsx**
6. ✅ **src/components/admin-zone/settings/user/sections/LogoutOtherSessions.tsx**
7. ✅ **src/components/admin-zone/members/InviteMemberForm.tsx**
8. ✅ **src/components/admin-zone/places/CreatePlaceButton.tsx**
9. ✅ **src/components/admin-zone/places/DeletePlaceButton.tsx**
10. ✅ **src/components/admin-zone/PlaceSettings.tsx**

---

## 📋 Remaining Files (9 files)

### 🔴 High Priority - Item Management

1. **src/components/admin-zone/items/CreateItemButton.tsx**
   - POST `/api/items`
   - Likely has FormData for image upload
   - Pattern: Same as CreatePlaceButton

2. **src/components/admin-zone/items/ItemRowActions.tsx**
   - DELETE `/api/items/[id]`
   - PATCH `/api/items/[id]` (for status toggle)

3. **src/components/admin-zone/items/EditBoxModal.tsx**
   - PATCH `/api/items/[id]`

4. **src/components/admin-zone/items/CreateBoxButton.tsx**
   - POST `/api/items` (box creation)

5. **src/components/admin-zone/items/CreateItemOrBoxButton.tsx**
   - POST `/api/items`

6. **src/components/admin-zone/items/InnerItems.tsx**
   - May have state-changing operations

7. **src/components/admin-zone/items/ConfirmDeleteBoxModal.tsx**
   - DELETE `/api/items/[id]`

### 🟡 Medium Priority - Place/Item Associations

8. **src/components/admin-zone/PlacesItems.tsx**
   - POST/DELETE for place-item associations
   - `/api/places/[placeId]/items`

9. **src/components/admin-zone/places/AddItemsToPlaceModal.tsx**
   - POST `/api/places/[placeId]/items`

### 🟢 Lower Priority - Miscellaneous

10. **src/components/admin-zone/PlacesMembers.tsx**
    - Member assignment operations

11. **src/components/admin-zone/members/Drawer.tsx**
    - Member role updates

12. **src/components/LogoutButton.tsx**
    - POST `/api/logout`

13. **src/components/admin-zone/settings/user/sections/LanguagePreference.tsx**
    - PATCH `/api/users/me/language`

14. **src/components/layout/LanguageSwitcher.tsx**
    - PATCH language preference

### 🔵 Receipt Creation (Critical for Cash Register)

15. **src/components/cash-register/CashRegisterClient.tsx**
    - POST `/api/receipts` - **CRITICAL FOR SALES**
    - This is a high-priority one!

16. **src/app/auth/forgot-password/page.tsx**
    - POST `/api/password/reset-request` (public endpoint - needs skipCsrf: true)

17. **src/app/auth/reset-password/page.tsx**
    - POST `/api/password/reset` (already has backend CSRF, needs frontend update)

---

## 🎯 Quick Migration Pattern

For each file, follow these 3 steps:

### Step 1: Add Import
```typescript
import { api, ApiError } from '@/lib/api-client'
// or for FormData:
import { apiRequest, ApiError } from '@/lib/api-client'
```

### Step 2: Replace fetch() calls

**Simple POST/PATCH/DELETE:**
```typescript
// Before
const res = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
const result = await res.json()

// After
const result = await api.post('/api/endpoint', data)
```

**With FormData (for file uploads):**
```typescript
// Before
const fd = new FormData()
fd.append('file', file)
const res = await fetch('/api/upload', {
  method: 'POST',
  body: fd,
})

// After
const fd = new FormData()
fd.append('file', file)
const result = await apiRequest('/api/upload', {
  method: 'POST',
  body: fd,  // FormData auto-detected, CSRF auto-included
  headers: {}, // Empty - browser sets Content-Type
})
```

**Public Endpoints (login, register, password reset):**
```typescript
const result = await api.post('/api/public-endpoint', data, { skipCsrf: true })
```

### Step 3: Update Error Handling
```typescript
// Before
if (!res.ok) {
  const error = await res.json()
  setError(error.message)
}

// After
try {
  const data = await api.post('/api/endpoint', payload)
  // success
} catch (err) {
  if (err instanceof ApiError) {
    setError(err.message)
  } else {
    setError('Unknown error')
  }
}
```

---

## 🚀 Priority Order for Completion

### Phase 1: Critical for Basic Operations (Complete 1-6 first)
1. ✅ Auth pages (login/register) - DONE
2. ✅ User settings (profile, password, delete) - DONE
3. ✅ Place management - DONE
4. 🔴 **CashRegisterClient.tsx** - CRITICAL FOR SALES!
5. 🔴 **CreateItemButton.tsx, ItemRowActions.tsx** - CRITICAL FOR INVENTORY
6. 🔴 **Password reset pages** - CRITICAL FOR USER RECOVERY

### Phase 2: Team & Item Management (Complete 7-10)
7. InviteMemberForm - ✅ DONE
8. EditBoxModal, CreateBoxButton
9. PlacesItems, AddItemsToPlaceModal
10. ConfirmDeleteBoxModal, InnerItems

### Phase 3: Polish (Complete 11-14)
11. PlacesMembers, member Drawer
12. LogoutButton
13. LanguagePreference, LanguageSwitcher
14. Any remaining edge cases

---

## 🧪 Testing Strategy

After updating all components, test these flows:

### Critical Flows (Test First)
- ✅ User registration
- ✅ User login
- ✅ Profile update
- ✅ Password change
- ✅ Account deletion
- ✅ Place creation/update/delete
- ⚠️ **Receipt creation (CASH REGISTER)** - HIGH PRIORITY!
- ⚠️ Item creation/update/delete
- Password reset flow

### Secondary Flows
- Team member invitation
- Item-place associations
- Language preference
- Logout

---

## 📦 Files by Endpoint

### `/api/items`
- CreateItemButton.tsx (POST)
- CreateBoxButton.tsx (POST)
- CreateItemOrBoxButton.tsx (POST)

### `/api/items/[id]`
- ItemRowActions.tsx (PATCH, DELETE)
- EditBoxModal.tsx (PATCH)
- ConfirmDeleteBoxModal.tsx (DELETE)

### `/api/receipts`
- **CashRegisterClient.tsx (POST)** - CRITICAL!

### `/api/password/*`
- forgot-password/page.tsx (POST `/api/password/reset-request`)
- reset-password/page.tsx (POST `/api/password/reset`)

### `/api/users/me/*`
- LanguagePreference.tsx (PATCH `/api/users/me/language`)

### `/api/places/[id]/items`
- PlacesItems.tsx (POST, DELETE)
- AddItemsToPlaceModal.tsx (POST)

---

## 🔍 How to Find Remaining fetch() Calls

Run these commands to find files that still need updating:

```bash
# Find all POST/PATCH/DELETE fetch calls
grep -r "method.*['\"]POST\|method.*['\"]PATCH\|method.*['\"]DELETE" src/components src/app --include="*.tsx" --include="*.ts"

# Find all fetch calls (including GET)
grep -r "fetch(" src/components src/app --include="*.tsx" --include="*.ts" | grep -v "node_modules"

# Check for files not yet using api-client
grep -rL "from '@/lib/api-client'" src/components/admin-zone src/components/cash-register --include="*.tsx"
```

---

## ✨ What's Working Now

- ✅ Registration & Login (public endpoints working)
- ✅ User profile management (CSRF protected)
- ✅ Password changes (CSRF protected)
- ✅ Account deletion (CSRF protected)
- ✅ Session management (CSRF protected)
- ✅ Place CRUD operations (CSRF protected)
- ✅ Team member invitations (CSRF protected)
- ✅ FormData uploads (avatar upload with CSRF)

---

## 🎯 Next Immediate Steps

**Recommendation: Update these 3 files next for maximum impact:**

1. **src/components/cash-register/CashRegisterClient.tsx**
   - Critical for creating receipts (sales transactions)
   - Without this, the cash register won't work!

2. **src/components/admin-zone/items/CreateItemButton.tsx**
   - Critical for adding new inventory items
   - Likely has FormData for images

3. **src/components/admin-zone/items/ItemRowActions.tsx**
   - Critical for editing/deleting items
   - Quick actions in item lists

**These 3 files will unlock ~80% of remaining app functionality!**

---

*Last Updated: 2025-01-22*
*Progress: 10/27 files complete (~37%)*
*Critical paths: 60% complete*
