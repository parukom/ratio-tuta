# Security Policy

## 🔒 Our Commitment

At Ratio Tuta, security and privacy are at the core of everything we do. We take the security of our users' data extremely seriously and appreciate the security community's efforts in responsibly disclosing vulnerabilities.

## 📋 Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.x.x   | :white_check_mark: | Active development |
| < 1.0   | :x:                | No longer supported |

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in Ratio Tuta, please help us protect our users by following responsible disclosure practices.

### How to Report

**Please DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, please email us at:
- **Email:** tomasdudovicius@gmail.com
- **Subject:** [SECURITY] Brief description of the issue

### What to Include in Your Report

To help us understand and address the issue quickly, please include:

1. **Description:** A clear description of the vulnerability
2. **Impact:** What could an attacker accomplish with this vulnerability?
3. **Steps to Reproduce:** Detailed steps to reproduce the issue
4. **Proof of Concept:** If possible, include a PoC or example exploit
5. **Affected Components:** Which parts of the system are affected?
6. **Suggested Fix:** If you have ideas on how to fix it (optional)
7. **Your Contact Info:** How we can reach you for follow-up

### What to Expect

- **Initial Response:** Within 48 hours of your report
- **Status Update:** Within 7 days with our assessment and timeline
- **Resolution:** We'll work to fix critical issues as quickly as possible
- **Credit:** With your permission, we'll credit you in our security advisories

### Our Commitment to You

- We will respond promptly to your report
- We will keep you informed of our progress
- We will not take legal action against researchers who follow responsible disclosure
- We will publicly acknowledge your contribution (if you wish)

## 🛡️ Security Features

Ratio Tuta implements multiple layers of security protection:

### Authentication & Sessions
- ✅ **Secure Sessions:** `__Host-` prefix cookies with HMAC signatures
- ✅ **Password Security:** bcrypt hashing (12 rounds) + HIBP breach checking
- ✅ **Email Verification:** Required for account activation
- ✅ **Password Requirements:** 8-128 characters with complexity checks

### Data Protection
- ✅ **Email Encryption:** AES-256-GCM encryption at rest with HMAC indexing
- ✅ **HTTPS Only:** Strict Transport Security (HSTS) with 2-year max-age
- ✅ **Secure File Uploads:** Presigned S3 URLs with size/type validation (5MB max)

### Attack Prevention
- ✅ **CSRF Protection:** Stateless HMAC-based tokens on all state-changing operations
- ✅ **Rate Limiting:** Distributed rate limiting via Upstash Redis
  - Authentication: 5 attempts per 15 minutes per IP
  - API: Sliding window algorithm
- ✅ **XSS Protection:** Content Security Policy (CSP) headers
- ✅ **Clickjacking Protection:** X-Frame-Options: SAMEORIGIN
- ✅ **SQL Injection Protection:** Parameterized queries via Prisma ORM

### Monitoring & Auditing
- ✅ **Audit Logging:** Comprehensive logging of security-sensitive actions
- ✅ **Error Handling:** No sensitive data leaked in error messages
- ✅ **IP Tracking:** User-agent and IP logging for security events

## 🔐 Security Best Practices for Self-Hosting

If you're deploying Ratio Tuta yourself, follow these security guidelines:

### Environment Configuration

1. **Generate Strong Secrets**
   ```bash
   # Generate cryptographically secure secrets (32+ bytes)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Required Environment Variables**
   - `SESSION_SECRET` - Min 32 chars, random
   - `HMAC_SECRET` - Min 32 chars, random
   - `CRYPTO_KEY` - Exactly 32 bytes, random

3. **Never Commit Secrets**
   - Keep `.env` files in `.gitignore`
   - Use environment variables or secret managers
   - Rotate secrets regularly

### Production Deployment

- ✅ **Use HTTPS:** Always enable HTTPS in production (automatic with Vercel)
- ✅ **Enable Redis:** Use Upstash Redis for distributed rate limiting
- ✅ **Database Security:** Use connection pooling (PgBouncer) and SSL
- ✅ **Monitor Logs:** Regularly review audit logs for suspicious activity
- ✅ **Update Dependencies:** Run `npm audit` regularly
- ✅ **Backup Database:** Regular automated backups with encryption

### OWASP Top 10 Coverage

| Risk | Protection | Implementation |
|------|------------|----------------|
| A01: Broken Access Control | ✅ | Role-based access control, team isolation |
| A02: Cryptographic Failures | ✅ | AES-256-GCM, TLS, bcrypt |
| A03: Injection | ✅ | Prisma ORM, parameterized queries |
| A04: Insecure Design | ✅ | Security-first architecture |
| A05: Security Misconfiguration | ✅ | Secure headers, CSP, HSTS |
| A06: Vulnerable Components | ✅ | Regular updates, npm audit |
| A07: Authentication Failures | ✅ | Strong passwords, HIBP, sessions |
| A08: Data Integrity Failures | ✅ | CSRF tokens, HMAC verification |
| A09: Logging Failures | ✅ | Comprehensive audit logging |
| A10: SSRF | ✅ | No user-controlled URLs |

## 📚 Additional Security Resources

- **Documentation:** [Developer Guide](/docs/developer#security)
- **Architecture:** See [README.md](README.md) for tech stack details
- **Dependencies:** All dependencies scanned with `npm audit`

## 🏆 Security Hall of Fame

We'd like to thank the following researchers for responsibly disclosing security issues:

<!-- We'll add contributors here as they report issues -->

*Be the first to help us improve security!*

## 📞 Contact

For security-related questions or concerns:
- **Email:** tomasdudovicius@gmail.com
- **GitHub:** [Report via Security Advisory](https://github.com/your-repo/security/advisories/new)

For general support:
- **User Guide:** [/docs/user](/docs/user)
- **Email:** tomasdudovicius@gmail.com

---

**Last Updated:** October 2025

*This security policy is subject to change. Check this page regularly for updates.*
