# og-route-kit

[![CI](https://github.com/pixelbrew-studio/og-route-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/pixelbrew-studio/og-route-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Code-rendered Open Graph image routes for Next.js.

`og-route-kit` turns TSX card components into typed `next/og` image endpoints. It handles query params, defaults, text cleanup, image URLs, metadata helpers, route checks, and static PNG export.

This is deliberately narrow. It is not a hosted renderer, visual editor, Figma importer, template marketplace, or browser-accurate CSS renderer.

## Status

Experimental and GitHub-first. This package is not published to npm yet. The scaffold, core helpers, Next route helper, metadata helper, CLI checks, and example app are in place, but the public API can still change while the package is dogfooded in real Next apps.

## Features

- Typed App Router `GET` handler factory for `next/og`
- Deterministic query param normalization with fallbacks, required fields, whitespace cleanup, and max-length truncation
- Framework-independent core helpers for image route URLs and size presets
- Next metadata helper for Open Graph and Twitter cards
- CLI commands for route health checks, preview URLs, and static PNG export
- Minimal Next App Router example for real route verification

## Usage

This package is currently intended for local dogfooding, direct GitHub installs, or as a workspace dependency inside a larger app. Do not depend on a stable npm package yet.

Install from GitHub while the package is not published to npm:

```bash
pnpm add github:pixelbrew-studio/og-route-kit
```

For npm:

```bash
npm install github:pixelbrew-studio/og-route-kit
```

For a private repository, the consuming environment must already be authenticated with GitHub. Once the repository is public, the same GitHub dependency works without private repository credentials. For reproducible app builds, pin the dependency to a commit or tag:

```json
{
  "dependencies": {
    "og-route-kit": "github:pixelbrew-studio/og-route-kit#<commit-or-tag>"
  }
}
```

GitHub installs run the package `prepare` script and build `dist` from source during installation.

Runtime peer dependencies:

```bash
pnpm add next react
```

`og-route-kit` expects Node.js 20 or newer.

## Quickstart

Create an App Router route:

```tsx
// app/api/og/route.tsx
import { createOgRoute } from "og-route-kit/next";

import { ProductOgCard } from "@/og/ProductOgCard";

export const runtime = "edge";

export const GET = createOgRoute({
  size: "og",
  defaults: {
    eyebrow: "Acme",
    title: "Ship better social cards.",
    description: "Code-rendered Open Graph images for product pages.",
  },
  fields: {
    eyebrow: { max: 80 },
    title: { max: 140, required: true },
    description: { max: 180 },
  },
  render: ProductOgCard,
});
```

Build metadata once and reuse it:

```ts
// lib/social.ts
import { createSocialMetadata } from "og-route-kit/next";

export const social = createSocialMetadata({
  siteUrl: "https://acme.com",
  siteName: "Acme",
  twitter: "@acme",
  imageRoute: "/api/og",
  defaultImage: "/og-image.png",
});
```

```ts
// app/pricing/page.tsx
import type { Metadata } from "next";

import { social } from "@/lib/social";

export const metadata: Metadata = social.website({
  title: "Pricing",
  description: "Simple usage-based pricing.",
  path: "/pricing",
  image: {
    eyebrow: "Pricing",
    title: "Usage-based pricing.",
    description: "Start small. Scale when needed.",
  },
});
```

## CLI

Check a running route:

```bash
npx og-route-kit check \
  --url "http://localhost:3000/api/og?title=Hello"
```

Export a static fallback PNG from a running route:

```bash
npx og-route-kit export \
  --url "http://localhost:3000/api/og?title=Hello" \
  --out public/og-image.png
```

Print preview URLs:

```bash
npx og-route-kit preview --origin http://localhost:3000 --route /api/og
```

## API

### `createOgRoute`

Creates a Next App Router `GET` handler that normalizes search params and returns an `ImageResponse`.

```ts
import { createOgRoute } from "og-route-kit/next";
```

### `createSocialMetadata`

Builds Open Graph and Twitter metadata for website and article pages.

```ts
import { createSocialMetadata } from "og-route-kit/next";
```

### `normalizeOgParams`

Framework-independent field normalization:

- missing, empty, and whitespace-only values use a field fallback or default
- whitespace collapses by default
- strings trim before validation
- `max` truncates deterministically
- required fields fail clearly when no usable value exists

```ts
import { normalizeOgParams } from "og-route-kit/core";
```

### `buildOgImageUrl`

Builds an encoded route URL while preserving existing query params and hash fragments.

```ts
import { buildOgImageUrl } from "og-route-kit/core";
```

## Example App

Build the package and run the example route:

```bash
pnpm install
pnpm build
pnpm --filter og-route-kit-next-app-example exec next dev -p 3000
```

Open:

```txt
http://localhost:3000/api/og?title=Hello&description=World
```

The route should return a `1200 x 630` PNG.

## Development

```bash
pnpm install
pnpm run ci
```

Useful targeted commands:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm example:build
pnpm pack:check
```

For a full local route check, run:

```bash
pnpm verify:local
```

That starts the example app, checks the OG route, exports a test PNG to `.context/og-image-test.png`, and stops the server.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes focused on the Next-first route kit workflow until the API has been dogfooded.

## Release

This repo is intentionally not wired to publish to npm yet. The future npm release checklist lives in [docs/release.md](docs/release.md).
