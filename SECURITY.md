# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it **privately**:

1. **GitHub Security Advisories** — use the "Report a vulnerability" button on the repository's Security tab (preferred)
2. **Email** — contact the maintainers directly (see repository profile for contact details)
3. **Do NOT** open a public GitHub issue for security vulnerabilities

Please include in your report:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if you have one)

We aim to acknowledge all reports within **48 hours** and will work with you on a coordinated disclosure timeline.

---

## Security Best Practices

### Deployment

1. **Strong credentials**
   - Use at least 16 characters for `ADMIN_PASSWORD`
   - Generate with: `openssl rand -base64 24`
   - Regenerate `AUTH_SECRET` for every new instance
   - Generate with: `openssl rand -base64 32`

2. **Protect your secrets file**
   ```bash
   chmod 600 .env.local
   ```
   Never commit `.env.local` to version control.

3. **Use HTTPS in production**
   - Put the app behind a reverse proxy (Caddy, nginx) that handles TLS
   - The auth cookie automatically sets `secure: true` when the app detects HTTPS

4. **Restrict network access**
   - Bind the Node.js process to `127.0.0.1`, not `0.0.0.0`
   - Expose only via the reverse proxy
   - Configure a firewall (UFW, iptables) to block direct access to the app port

5. **Keep dependencies up to date**
   ```bash
   npm audit
   npm audit fix
   ```

### Development

1. **Never commit:**
   - `.env.local` (passwords, secrets)
   - `data/*.json` (operational runtime data)
   - `data/*.db` (usage metrics databases)
   - Real usernames, emails, API keys, or tokens in source code

2. **Use branding config:**
   - All personal identifiers must come from environment variables via `src/config/branding.ts`
   - Never hardcode names, handles, or contact details in source files

3. **Input handling:**
   - Never use `eval()` or `Function()` with user-supplied input
   - Validate and sanitize all API inputs
   - Use parameterized queries for all SQLite operations
   - Escape user-generated content rendered in the UI

---

## Built-in Security Controls

| Control | Implementation |
|---|---|
| Authentication | Password + signed HTTP-only cookie |
| Rate limiting | 5 failed logins → 15-minute lockout per IP |
| Route protection | `src/middleware.ts` guards all routes |
| Public endpoints | Only `/api/auth/login` and `/api/health` |
| Terminal API | Strict allowlist; dangerous commands blocked |
| Cookie flags | `httpOnly`, `sameSite: lax`, `secure` in production |

---

## Production Deployment Checklist

Before going live:

- [ ] `ADMIN_PASSWORD` set to a strong, unique value
- [ ] `AUTH_SECRET` freshly generated (`openssl rand -base64 32`)
- [ ] `.env.local` permissions set to `600`
- [ ] HTTPS configured via reverse proxy
- [ ] Node process bound to loopback (`127.0.0.1`)
- [ ] Firewall configured to block direct access to app port
- [ ] `npm audit` run — no critical/high vulnerabilities unaddressed
- [ ] `data/` directory included in backup routine

---

## Responsible Disclosure

We follow coordinated vulnerability disclosure:

1. Researcher notifies us privately with full details
2. We confirm receipt, triage the report, and begin working on a fix
3. We release a patched version
4. Public disclosure happens only after the patch is available and deployed

We credit researchers who follow this process in the release notes (unless they prefer to remain anonymous).

Thank you for helping keep FeiControl secure. 🔒
