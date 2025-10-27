# Ratio Tuta

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

A modern financial management and inventory tracking application built with Next.js, featuring team collaboration, subscription packages, and comprehensive security.

## 🚀 Features

### Core Functionality
- **Team Management** - Multi-team support with role-based access control (Owner, Admin, Member)
- **Inventory Tracking** - Manage items, categories, stock levels, and locations
- **Receipt Management** - Track financial transactions and sales
- **Place Management** - Manage physical locations and venues
- **User Authentication** - Secure email-based authentication with verification
- **Subscription Packages** - Flexible team-based pricing with free and paid tiers

### Security Features
- **Redis Rate Limiting** - Distributed rate limiting via Upstash
- **CSRF Protection** - Token-based + SameSite cookie protection
- **Encrypted Email Storage** - AES-256-GCM encryption with HMAC indexing
- **S3 Upload Security** - Presigned URLs with size/type enforcement
- **Session Security** - `__Host-` prefix cookies with HMAC signatures
- **Password Security** - bcrypt hashing + HIBP breach checking
- **Audit Logging** - Comprehensive action tracking with IP/user-agent

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.0 with React 19.1.0
- **Language:** TypeScript 5
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Authentication:** Custom session management with bcryptjs
- **Storage:** AWS S3 for file uploads
- **Email:** Resend for transactional emails
- **Rate Limiting:** Upstash Redis
- **Payments:** Stripe integration
- **UI:** Tailwind CSS 4, Headless UI, Framer Motion
- **Charts:** ApexCharts for data visualization
- **i18n:** next-intl for internationalization

## 📋 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon account)
- AWS S3 bucket
- Upstash Redis instance
- Resend API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ratio-tuta
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Generate secure secrets:**
   ```bash
   # Generate SESSION_SECRET, HMAC_SECRET, CRYPTO_KEY:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open browser:**
   ```
   http://localhost:3000
   ```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[docs/README.md](./docs/README.md)** - Documentation index
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Security guidelines and credential management
- **[docs/CSRF_PROTECTION.md](./docs/CSRF_PROTECTION.md)** - CSRF implementation guide
- **[docs/S3_BUCKET_POLICY.md](./docs/S3_BUCKET_POLICY.md)** - AWS S3 security configuration
- **[SECURITY_FIXES_COMPLETED.md](./SECURITY_FIXES_COMPLETED.md)** - Recent security audit and fixes

## 🔐 Security

This project follows security best practices:

- All secrets stored in environment variables (never committed)
- Encrypted data storage with AES-256-GCM
- Rate limiting on all authentication endpoints
- CSRF protection with tokens
- SQL injection protection via Prisma ORM
- XSS protection via React's automatic escaping
- Secure session management with `__Host-` cookies

See [SECURITY_FIXES_COMPLETED.md](./SECURITY_FIXES_COMPLETED.md) for security audit results (Score: **9.5/10**).

## 📦 Packages & Subscriptions

The application supports team subscription packages.

### Registration
On user self-registration (`POST /api/register/self`), a team is created and the `free` package is automatically assigned if present by creating a `TeamSubscription` with `priceCents = 0`.

### Purchasing / Upgrading
Endpoint: `POST /api/packages/purchase`

Request body:
```json
{ "teamId": "<team-id>", "packageSlug": "pro", "annual": true }
```

**Rules:**
- Caller must be owner or admin of the team
- Previous active subscriptions are deactivated
- New `TeamSubscription` is created with pricing from `monthlyCents` or `annualCents`

### Helper Utilities
`src/lib/package.ts` provides:
- `getFreePackage()` – fetch free package by slug
- `assignPackageToTeam(teamId, packageSlug, { annual? })` – transactional reassignment

### Schema
See `Package` and `TeamSubscription` models in `prisma/schema.prisma`.

## 🚢 Deployment

### Environment Variables

Required for production:

```env
# Database
DATABASE_URL='postgresql://...'
DIRECT_URL='postgresql://...'

# Redis (REQUIRED for production)
UPSTASH_REDIS_REST_URL='https://...'
UPSTASH_REDIS_REST_TOKEN='...'

# AWS S3
AWS_REGION='us-east-1'
AWS_ACCESS_KEY_ID='...'
AWS_SECRET_ACCESS_KEY='...'
S3_BUCKET_NAME='...'

# Encryption Keys
SESSION_SECRET='...'
HMAC_SECRET='...'
CRYPTO_KEY='...'  # Exactly 32 bytes

# Email
RESEND_API_KEY='...'
EMAIL_FROM='noreply@yourdomain.com'

# App URL
NEXT_PUBLIC_APP_URL='https://yourdomain.com'

# Optional
HIBP_FAIL_OPEN='false'  # Recommended: fail closed
CSRF_SECRET='...'  # Falls back to SESSION_SECRET
STRIPE_SECRET_KEY='...'
STRIPE_PUBLISHABLE_KEY='...'
```

### Pre-Deployment Checklist

Follow the comprehensive checklist in [SECURITY_FIXES_COMPLETED.md](./SECURITY_FIXES_COMPLETED.md#-deployment-checklist):

- [ ] Redis configured (Upstash)
- [ ] S3 bucket policy applied
- [ ] Email migration completed
- [ ] All secrets are production-ready
- [ ] Environment variables set in hosting platform
- [ ] Database migrations applied

### Recommended Hosting

- **Vercel** (Next.js optimized)
- **Railway** (full-stack support)
- **AWS** (complete control)

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

## 📊 Project Structure

```
ratio-tuta/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   └── (pages)/      # Page components
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   └── generated/        # Prisma generated client
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
├── scripts/              # Utility scripts
│   └── migrate-emails.ts # Email migration script
├── lib/                  # Shared utilities
│   ├── crypto.ts         # Encryption utilities
│   ├── session.ts        # Session management
│   ├── rate-limit-redis.ts  # Rate limiting
│   ├── csrf.ts           # CSRF protection
│   └── ...
└── public/               # Static assets
```

## 🔄 Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and test:**
   ```bash
   npm run dev
   npm run lint
   npm test
   ```

3. **Commit with descriptive message:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/your-feature
   ```

## 🤝 Contributing

Contributions are welcome! This project is open source under the MIT License.

### How to Contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code style (ESLint + Prettier)
4. Add tests for new features
5. Ensure all tests pass
6. Update documentation
7. Commit your changes (`git commit -m 'Add some amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Attribution

If you use this project in your work, please provide attribution:

```
Based on Ratio Tuta by Tomas Dudovicius
https://github.com/parukom/ratio-tuta
Licensed under MIT License
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

Copyright (c) 2025 Tomas Dudovicius

**In simple terms:**
- ✅ You can use this project commercially
- ✅ You can modify and distribute it
- ✅ You can use it privately
- 🔒 **You MUST keep the copyright notice and license** (my name must stay)
- ❌ No warranty provided

## 🆘 Support

For issues or questions:

1. Check [docs/](./docs/) directory
2. Review [SECURITY_FIXES_COMPLETED.md](./SECURITY_FIXES_COMPLETED.md)
3. Contact the development team

## 🎯 Roadmap

### High Priority
- [ ] 2FA (Two-Factor Authentication)
- [ ] API abuse detection
- [ ] WAF integration (Cloudflare/AWS)

### Medium Priority
- [ ] Session device tracking
- [ ] IP allowlisting for admin
- [ ] Webhook signature validation

### Low Priority
- [ ] Security bug bounty
- [ ] Mobile app support
- [ ] Advanced analytics

---

**Built with ❤️ using Next.js, TypeScript, and modern security practices.**
