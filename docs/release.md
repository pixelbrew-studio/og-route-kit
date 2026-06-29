# Future npm Release Checklist

This repository is GitHub-first for now. Do not publish to npm until the route kit has been dogfooded in at least one real Next app and the API is stable enough to support.

## Publish Only When These Are True

- A real app uses `createOgRoute` and `createSocialMetadata` without package-local assumptions.
- The README quickstart matches the dogfooded route exactly.
- The example app builds from a clean clone.
- `pnpm run ci` passes.
- `pnpm pack --dry-run` includes only expected package files.
- The npm package name is available or controlled by the maintainer.
- The maintainer is ready to support semver, changelogs, compatibility issues, and security updates.

## Work Needed Before npm

1. Decide the first public version, likely `0.1.0`.
2. Reintroduce release automation only when needed.
3. Configure npm provenance and an `NPM_TOKEN` secret in GitHub.
4. Add a release workflow or publish manually from a clean local checkout.
5. Replace README local-dogfood usage with normal install instructions.

Until then, keep using `pnpm pack --dry-run` as a package-shape check, not as a publishing commitment.
