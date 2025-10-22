# Documentation

This directory contains technical documentation for the Pecunia application.

## 📚 Available Documentation

### Security

- **[SECURITY.md](./SECURITY.md)** - Security guidelines, credential rotation, and incident response procedures
- **[CSRF_PROTECTION.md](./CSRF_PROTECTION.md)** - CSRF protection implementation guide (client & server)
- **[S3_BUCKET_POLICY.md](./S3_BUCKET_POLICY.md)** - AWS S3 bucket security configuration

## 🚀 Quick Start

### For Developers

1. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Generate secure secrets (see [SECURITY.md](./SECURITY.md))
   - Configure Redis, S3, and database credentials

2. **Security Implementation**
   - Review [CSRF_PROTECTION.md](./CSRF_PROTECTION.md) for client-side integration
   - Apply [S3_BUCKET_POLICY.md](./S3_BUCKET_POLICY.md) to AWS bucket

3. **Before Deployment**
   - Complete pre-deployment checklist in [SECURITY.md](./SECURITY.md)
   - Run security tests
   - Review audit logs

### For DevOps

1. **Production Setup**
   - Configure environment variables in hosting platform
   - Apply S3 bucket policy
   - Set up Redis (Upstash)
   - Enable monitoring and alerts

2. **Credential Management**
   - Follow rotation procedures in [SECURITY.md](./SECURITY.md)
   - Schedule quarterly credential rotation
   - Document credential locations securely

## 🔐 Security Features

This application implements multiple security layers:

- **Redis-based Rate Limiting** - Distributed rate limiting via Upstash
- **CSRF Token Protection** - Token-based CSRF validation + SameSite cookies
- **Encrypted Email Storage** - AES-256-GCM encryption + HMAC hashing
- **S3 Upload Security** - Bucket policies + presigned URL constraints
- **Session Security** - `__Host-` cookie prefix, HMAC signatures
- **Audit Logging** - Comprehensive action tracking
- **Password Security** - bcrypt + HIBP breach checking (fail closed)

## 📖 Related Documentation

- **Root Directory:**
  - `SECURITY_FIXES_COMPLETED.md` - Security audit report and fixes applied
  - `.env.example` - Environment variable template with security notes

## 🤝 Contributing

When adding new documentation:

1. Keep it concise and actionable
2. Include code examples where relevant
3. Link to external resources (OWASP, AWS docs, etc.)
4. Update this README with new document links
5. Write in English for accessibility

## 📧 Support

For security concerns or questions:
- Review existing documentation first
- Check `SECURITY_FIXES_COMPLETED.md` for recent changes
- Contact security team for incident response
