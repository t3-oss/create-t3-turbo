# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security findings to **security@gmacko.dev**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a detailed response
within 5 business days.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < Latest | No — upgrade to latest |

## Security Measures

This template includes the following security measures out of the box:

### Headers & Transport
- **HSTS** with `includeSubDomains` and `preload` (2-year max-age)
- **Content-Security-Policy** restricting script, style, and connection sources
- **X-Frame-Options: DENY** preventing clickjacking
- **X-Content-Type-Options: nosniff** preventing MIME sniffing
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** disabling camera, microphone, geolocation

### Authentication
- Session-based auth with secure, httpOnly cookies
- OAuth 2.0 with PKCE for social providers
- SAML 2.0 for enterprise SSO (optional)
- Rate limiting on auth endpoints

### Input Validation
- Zod schema validation on all tRPC procedure inputs
- HMAC-SHA256 signature verification for incoming webhooks

### Dependencies
- Automated dependency updates via Renovate
- Secret scanning via gitleaks in pre-commit hooks
- Lock file integrity checks in CI

### API Security
- CORS configured per environment
- Request ID tracing for audit trails
- tRPC procedures enforce authentication context
