# Contributing

`og-route-kit` is intentionally narrow: typed Open Graph image routes for Next.js App Router projects.

Good contributions make that workflow smaller, safer, or better documented. Avoid broad renderer abstractions, visual editors, hosted services, template marketplaces, and browser-accurate rendering unless the project direction changes explicitly.

## Local Setup

```bash
pnpm install
pnpm run ci
```

`pnpm run ci` runs the package typecheck, tests, build, example app build, and package dry run.

## Development Loop

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm example:build
```

To test the example route manually:

```bash
pnpm --filter og-route-kit-next-app-example exec next dev -p 3000
node dist/cli/index.js check --url "http://localhost:3000/api/og?title=Hello"
```

## Pull Requests

Before opening a PR:

- keep the change focused
- add or update tests for behavior changes
- run `pnpm run ci`
- include the exact verification commands in the PR description
- update the README when public API or first-use workflow changes
