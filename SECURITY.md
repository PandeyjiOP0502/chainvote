# Security Policy

## Supported Versions

We actively support the following versions of ChainVote:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ChainVote, please report it responsibly by following these steps:

### 1. **Do Not Open a Public Issue**
Please do not disclose security vulnerabilities in public GitHub issues.

### 2. **Report the Vulnerability**
Email us directly at: **security@chainvote.io**

Include the following information in your report:
- **Type of issue** (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s) related to the manifestation of the issue**
- **The location of the source code** (tag/branch/commit or direct URL)
- **Any special configuration required to reproduce the issue**
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept or exploit code (if possible)**
- **Impact of the issue, including how an attacker might exploit the issue**

### 3. **Response Timeline**
We will acknowledge your email within 48 hours, and will send a more detailed response within 72 hours indicating the next steps in handling your report.

After the initial reply to your report, the security team will endeavor to keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

### 4. **Disclosure Policy**
When the security team receives a security bug report, they will assign it to a primary handler. This person will coordinate the fix and release process, involving the following steps:

- Confirm the problem and determine the affected versions.
- Audit code to find any potential similar problems.
- Prepare fixes for all releases still under maintenance.
- Have the fix reviewed by the security team.
- Release new versions with the fixes.

## Security Best Practices

### For Users

- **Keep Updated**: Always use the latest version of ChainVote
- **Secure Environment**: Run ChainVote in a secure environment with proper firewall rules
- **Strong Authentication**: Use strong, unique passwords and enable 2FA where possible
- **Regular Backups**: Maintain regular backups of your data
- **Monitor Logs**: Regularly check application logs for suspicious activity

### For Developers

- **Input Validation**: Always validate and sanitize user inputs
- **Authentication**: Implement proper authentication and authorization
- **Data Protection**: Encrypt sensitive data at rest and in transit
- **Dependencies**: Keep all dependencies up to date and monitor for vulnerabilities
- **Error Handling**: Don't expose sensitive information in error messages

## Common Security Issues

### Face Recognition Security
- Ensure proper lighting conditions for accurate face recognition
- Regularly update face recognition models
- Implement fallback authentication methods
- Monitor for spoofing attempts

### Blockchain Security
- Use appropriate proof-of-work difficulty
- Regularly verify blockchain integrity
- Monitor for double-spending attempts
- Keep private keys secure

### API Security
- Implement rate limiting on all endpoints
- Use HTTPS for all communications
- Validate all API requests
- Implement proper CORS policies

## Security Headers

ChainVote implements the following security headers:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security

## Contact

For security-related questions or concerns, please contact:
- **Email**: security@chainvote.io
- **PGP Key**: Available upon request

## Acknowledgments

We appreciate security researchers and users who bring potential security issues to our attention. We will acknowledge your contribution (with your permission) in our security advisories.

---

**Note**: This security policy is subject to change. Please check back periodically for updates.