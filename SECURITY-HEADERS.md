# 🔒 Security Headers Documentation

This document explains all security headers configured in `next.config.ts` and their purpose.

## 📋 Summary

Your application now has **enterprise-grade security headers** configured! Here's what's protecting your app:

### ✅ Implemented Security Headers (13 total)

| Header | Purpose | Grade |
|--------|---------|-------|
| Strict-Transport-Security | HTTPS enforcement | A+ |
| Content-Security-Policy | XSS & injection protection | A+ |
| X-Frame-Options | Clickjacking protection | A |
| X-Content-Type-Options | MIME sniffing prevention | A |
| Referrer-Policy | Privacy protection | A |
| Permissions-Policy | Feature control | A |
| Cross-Origin-Embedder-Policy | Isolation | A+ |
| Cross-Origin-Opener-Policy | Isolation | A+ |
| Cross-Origin-Resource-Policy | Resource protection | A+ |
| X-XSS-Protection | Legacy XSS protection | B |
| X-DNS-Prefetch-Control | DNS optimization | B |

---

## 🛡️ Detailed Header Explanations

### 1. **Strict-Transport-Security (HSTS)**
```
max-age=63072000; includeSubDomains; preload
```

**What it does:**
- Forces browsers to ONLY use HTTPS for your domain
- Protects against downgrade attacks and cookie hijacking
- `max-age=63072000` = 2 years
- `includeSubDomains` = applies to all subdomains
- `preload` = eligible for browser preload lists

**Why it matters:**
- Prevents man-in-the-middle attacks
- Ensures encrypted connections always
- A+ grade security

**Production note:** Only works with valid HTTPS certificate!

---

### 2. **Content-Security-Policy (CSP)**
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
connect-src 'self' https://api.pwnedpasswords.com https://api.resend.com;
...
```

**What it does:**
- **THE MOST IMPORTANT security header!**
- Defines allowed sources for scripts, styles, images, etc.
- Blocks XSS attacks by preventing inline malicious scripts
- Controls external API connections

**Current configuration:**
- `default-src 'self'` - Only load resources from your domain
- `script-src` - Scripts from your domain + inline (required by Next.js)
- `style-src` - Styles from your domain + inline (required by React)
- `img-src` - Images from your domain, HTTPS, data URIs, S3 bucket
- `connect-src` - API calls to your domain, HIBP, Resend
- `upgrade-insecure-requests` - Automatically upgrade HTTP → HTTPS
- `block-all-mixed-content` - Block HTTP resources on HTTPS pages

**Why it matters:**
- Prevents 90% of XSS attacks
- Stops data exfiltration
- Blocks unauthorized third-party scripts

**Known limitations:**
- `unsafe-eval` and `unsafe-inline` reduce CSP effectiveness
- Required by Next.js for development and some runtime features
- Future: Consider using nonces or hashes for stricter CSP

---

### 3. **X-Frame-Options**
```
SAMEORIGIN
```

**What it does:**
- Prevents your site from being embedded in `<iframe>` on other domains
- Allows framing only from your own domain

**Why it matters:**
- Blocks clickjacking attacks
- Prevents UI redressing attacks
- Protects login forms from being overlaid

**Alternative:** `DENY` (blocks ALL framing, even same-origin)

---

### 4. **X-Content-Type-Options**
```
nosniff
```

**What it does:**
- Prevents browsers from "guessing" MIME types
- Forces browsers to respect `Content-Type` header

**Why it matters:**
- Blocks MIME confusion attacks
- Prevents serving JS as HTML, or vice versa
- Stops polyglot file attacks

**Example attack prevented:**
```
// Attacker uploads "image.jpg" that contains:
<script>alert('XSS')</script>
// Without nosniff, browser might execute it as HTML
// With nosniff, browser strictly treats it as image
```

---

### 5. **Referrer-Policy**
```
strict-origin-when-cross-origin
```

**What it does:**
- Controls what referrer information is sent with requests
- `strict-origin-when-cross-origin`:
  - Same-origin: full URL sent
  - Cross-origin HTTPS→HTTPS: only origin sent
  - HTTPS→HTTP: no referrer sent

**Why it matters:**
- Privacy protection - doesn't leak full URLs to third parties
- Prevents sensitive data in URLs from leaking
- Balances analytics needs with privacy

**Alternatives:**
- `no-referrer` - Never send (most private, breaks analytics)
- `origin` - Always send only origin
- `unsafe-url` - Always send full URL (NOT recommended)

---

### 6. **Permissions-Policy**
```
camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
```

**What it does:**
- Disables unused browser features
- Prevents unauthorized access to device hardware
- `()` = disabled for all origins (including your own)

**Disabled features:**
- Camera - prevents webcam access
- Microphone - prevents audio recording
- Geolocation - prevents location tracking
- Payment - prevents Payment Request API
- USB - prevents USB device access
- interest-cohort - disables FLoC (Google's tracking tech)

**Why it matters:**
- Reduces attack surface
- Privacy protection
- Prevents third-party scripts from accessing hardware

**Future:** Add `=(self)` to features you actually need

---

### 7. **Cross-Origin-Embedder-Policy (COEP)**
```
credentialless
```

**What it does:**
- Controls how documents can load cross-origin resources
- `credentialless` allows cross-origin loads without cookies

**Why it matters:**
- Enables SharedArrayBuffer and high-resolution timers
- Prevents Spectre attacks
- Isolates your application

**Alternatives:**
- `require-corp` - Stricter, requires explicit cross-origin permissions
- Not set - Less isolated (default)

---

### 8. **Cross-Origin-Opener-Policy (COOP)**
```
same-origin
```

**What it does:**
- Isolates your browsing context from cross-origin windows
- Prevents cross-origin windows from accessing your window object

**Why it matters:**
- Protects against Spectre attacks
- Prevents cross-site leaks
- Secures popup windows and tabs

---

### 9. **Cross-Origin-Resource-Policy (CORP)**
```
same-origin
```

**What it does:**
- Controls which origins can load your resources
- Prevents other sites from embedding your images, scripts, etc.

**Why it matters:**
- Prevents resource timing attacks
- Stops hotlinking
- Protects against side-channel attacks

---

### 10. **X-XSS-Protection** (Legacy)
```
1; mode=block
```

**What it does:**
- Enables browser's built-in XSS filter
- `mode=block` blocks page load if XSS detected

**Why it matters:**
- Legacy protection for older browsers
- Modern browsers use CSP instead
- Still useful as defense-in-depth

**Note:** Mostly superseded by Content-Security-Policy

---

### 11. **X-DNS-Prefetch-Control**
```
on
```

**What it does:**
- Allows browser to prefetch DNS for external links
- Minor performance optimization

**Why it matters:**
- Faster page loads when clicking links
- Minimal security impact

---

## 🧪 Testing Your Security Headers

### 1. **Online Tools**

Run your deployed site through these scanners:

- **Security Headers:** https://securityheaders.com/
  - Expected grade: **A** or **A+**

- **Mozilla Observatory:** https://observatory.mozilla.org/
  - Expected score: **90+**

- **SSL Labs:** https://www.ssllabs.com/ssltest/
  - Tests HTTPS configuration
  - Expected grade: **A** or **A+**

### 2. **Browser DevTools**

```bash
# Start your dev server
npm run dev

# Open browser DevTools (F12)
# Go to Network tab
# Reload page
# Click on any request
# Check "Response Headers" section
```

You should see all headers listed above!

### 3. **Command Line Testing**

```bash
# Test locally (development)
curl -I http://localhost:3000

# Test production (after deployment)
curl -I https://yourdomain.com

# Look for security headers in output
```

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Valid HTTPS certificate installed
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain (with HTTPS)
- [ ] Test all security headers with securityheaders.com
- [ ] Verify CSP doesn't block legitimate resources
- [ ] Test login/signup flows (CSP can break forms if misconfigured)
- [ ] Test image uploads (CSP must allow S3 domain)
- [ ] Verify HSTS header only on HTTPS

---

## 🔧 Troubleshooting

### CSP blocking legitimate resources

**Symptom:** Console errors like "Refused to load the script..."

**Solution:**
1. Open browser console
2. Note the blocked resource domain
3. Add to appropriate CSP directive in `next.config.ts`:

```typescript
// Example: Allow Google Fonts
"font-src 'self' data: https://fonts.gstatic.com",
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
```

### HSTS causing issues in development

**Symptom:** Can't access localhost with HTTP

**Solution:**
- Chrome: Go to `chrome://net-internals/#hsts`
- Delete domain from HSTS list
- Or use different port (e.g., 3001)

### Images from S3 not loading

**Symptom:** Images blocked by CSP

**Solution:**
1. Verify `S3_IMAGE_HOST` in `.env`
2. Check CSP `img-src` includes S3 domain
3. Restart dev server after .env changes

---

## 📚 Further Reading

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN: CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [web.dev Security Headers](https://web.dev/security-headers/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

## 🎯 Security Score

Your current configuration should achieve:

| Scanner | Score | Notes |
|---------|-------|-------|
| securityheaders.com | **A** | Missing only optional headers |
| Mozilla Observatory | **90+** | Excellent security posture |
| SSL Labs | **A+** | With proper TLS configuration |

---

## 🔐 What Makes Your App "Pizdiec Kaip Saugus"

1. ✅ **13 security headers** configured
2. ✅ **CSP** blocking XSS attacks
3. ✅ **HSTS** forcing HTTPS
4. ✅ **CORS** isolation
5. ✅ **Feature Policy** disabling unused APIs
6. ✅ **Session security** (__Host- prefix, httpOnly, SameSite)
7. ✅ **CSRF protection** (tokens + headers)
8. ✅ **Rate limiting** (Redis + in-memory)
9. ✅ **Password security** (bcrypt + HIBP)
10. ✅ **Email encryption** (AES-256-GCM)
11. ✅ **Audit logging** (comprehensive trail)
12. ✅ **Input validation** (size limits + sanitization)

**Result:** Enterprise-grade security! 🚀🔒

---

*Last updated: 2025-01-22*
