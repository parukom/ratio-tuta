# Security Guidelines

## Environment Variables

### Best Practices

1. **Store secrets only in `.env` file**
   - `.env` is already in `.gitignore`
   - Never commit `.env` to version control

2. **Use `.env.example` as template**
   ```bash
   cp .env.example .env
   # Fill in real values
   ```

3. **Generate secure secrets**
   ```bash
   # Generate SESSION_SECRET, HMAC_SECRET, CRYPTO_KEY, CRON_SECRET:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### What NOT to Do

- ❌ Never commit `.env` to git
- ❌ Don't hardcode secrets in code
- ❌ Don't share `.env` via email/Slack/messaging
- ❌ Don't screenshot `.env` files

## Credential Rotation

If secrets are compromised, rotate immediately:

### 1. Database (Neon PostgreSQL)
1. Go to https://console.neon.tech
2. Select project → Settings → Reset password
3. Update `DATABASE_URL` and `DIRECT_URL` in `.env`

### 2. AWS S3 Keys
1. Go to AWS IAM Console
2. Users → Select user → Security credentials
3. Deactivate old Access Keys
4. Create new Access Key
5. Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### 3. Resend API Key
1. Go to https://resend.com/api-keys
2. Revoke old key
3. Create new API key
4. Update `RESEND_API_KEY`

### 4. Redis (Upstash)
1. Go to https://console.upstash.com
2. Select database → Details → Reset token
3. Update `UPSTASH_REDIS_REST_TOKEN`

### 5. Stripe Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Revoke compromised keys (if production)
3. Create new keys
4. Update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`

### 6. Encryption Keys (SESSION_SECRET, HMAC_SECRET, CRYPTO_KEY)
```bash
# Generate new keys:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

⚠️ **IMPORTANT:** Changing `CRYPTO_KEY` means existing encrypted emails cannot be decrypted. Run migration script to re-encrypt existing data before rotating.

## Deployment Environments

### Development
- Use `.env` locally
- Test mode Stripe keys
- Development Redis database

### Production (Vercel/Railway/AWS)
1. Never upload `.env` file
2. Set environment variables via hosting dashboard:
   - **Vercel:** Project Settings → Environment Variables
   - **Railway:** Variables tab
   - **AWS:** Parameter Store / Secrets Manager

### Staging
- Separate database credentials
- Test mode Stripe keys
- Separate S3 buckets
- Separate Redis instance

## Pre-Deployment Checklist

- [ ] `.env` is not in git repository
- [ ] All secrets are production-ready (not test/example values)
- [ ] AWS IAM user has minimal required permissions
- [ ] Database user has minimal required permissions
- [ ] Stripe webhook secret matches dashboard
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Redis connection configured (Upstash)
- [ ] S3 bucket policy applied (see `S3_BUCKET_POLICY.md`)
- [ ] CSRF secret configured (or using SESSION_SECRET fallback)

## Incident Response

If you suspect credentials are compromised:

1. **Immediately inform team lead**
2. **Rotate all related credentials** (see sections above)
3. **Check audit logs** via `/api/audit-logs` for suspicious activity
4. **Monitor AWS CloudTrail** (if AWS was compromised)
5. **Review recent database changes** in Neon dashboard
6. **Check Redis activity** in Upstash console

## Security Monitoring

### Regular Checks
- Review audit logs weekly for anomalies
- Monitor failed login attempts
- Check rate limiting hits
- Review S3 access logs for unusual uploads
- Monitor CSRF validation failures

### Automated Alerts
- Set up CloudWatch alarms for AWS resources
- Enable Neon database alerts for unusual queries
- Configure Upstash alerts for high memory usage
- Set up Sentry for application errors

## Responsibilities

- **Developers:** Never commit secrets, follow secure coding practices
- **DevOps:** Rotate production credentials quarterly
- **Team Leads:** Review access permissions quarterly
- **Security Team:** Conduct security audits semi-annually

## Additional Resources

- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Neon Security Best Practices](https://neon.tech/docs/introduction/security)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Vercel Security](https://vercel.com/docs/security)

## See Also

- `S3_BUCKET_POLICY.md` - S3 security configuration
- `CSRF_PROTECTION.md` - CSRF implementation guide
- `SECURITY_FIXES_COMPLETED.md` - Security fixes applied to this project
