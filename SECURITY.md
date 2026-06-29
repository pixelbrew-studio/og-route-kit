# Security

Report security issues privately by emailing the maintainer listed on the GitHub repository profile, or by opening a private GitHub security advisory if the repository has advisories enabled.

Do not open a public issue for vulnerabilities.

## Supported Versions

Until `1.0.0`, only the latest published version receives security fixes.

## Scope

Relevant security reports include:

- unsafe URL or filesystem handling in the CLI
- generated metadata that can create invalid or misleading social URLs
- route helper behavior that exposes unexpected request data
- package publication or CI compromise risks

Out of scope:

- visual design preferences in example cards
- Next.js or React vulnerabilities without an `og-route-kit` specific exploit path
- reports that require unsupported Node.js versions
