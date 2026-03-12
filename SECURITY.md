# Security Policy

## Supported Versions

| Version | Supported            |
|---------|----------------------|
| 0.x.x   | ✅ Active development |

> Once v1.0.0 is released, this table will be updated to reflect the support policy.

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues.**
If you discover a security vulnerability, please report it responsibly:

1. **Open a [GitHub Security Advisory](https://github.com/your-org/agent-flow-v2/security/advisories/new)**
   (recommended — private by default)
2. Or **email** the maintainers directly at: `security@your-domain.com`
    - Subject: `[SECURITY] Brief description`
    - Include: steps to reproduce, impact assessment, suggested fix (if any)

### What to Expect

- **Acknowledgement:** within 48 hours
- **Status update:** within 5 business days
- **Resolution target:** within 30 days for critical issues
- You will be credited in the release notes (unless you prefer to remain anonymous)

## Security Strategy

The full security strategy is documented in [ADR-019 — Security Strategy](docs/adr/019-security-strategy.md).
Key principles:

- **Secrets management:** All secrets via environment variables, never committed to git
- **Input validation:** All inputs validated via `class-validator` DTOs (NestJS)
- **Authentication:** JWT-based authentication (stateless)
- **Dependency security:** Automated CVE scanning via `pnpm audit` and GitHub Dependabot
- **Least privilege:** Database users and API tokens scoped to minimum required permissions

## Security Best Practices for Contributors

- Never commit `.env` files or secrets (enforced via `.gitignore`)
- Use `pnpm audit` before submitting PRs
- Follow the [Coding Standards](docs/guides/coding-standards.md) for input validation
- Review [ADR-019](docs/adr/019-security-strategy.md) for the full security requirements
