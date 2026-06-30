# Plan 001: CLI argument/command logic is unit-tested

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 70e8e93..HEAD -- src/cli/index.ts test/core.test.ts`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `70e8e93`, 2026-06-30

## Why this matters

The CLI's PNG-fetch layer (`src/cli/fetch-png.ts`) is well tested, but the
command layer in `src/cli/index.ts` — flag parsing, integer validation,
required-flag checks, and preview-URL construction — has zero test coverage.
The file also ends with a top-level `await main()`, so it cannot be imported
into a test without executing the CLI (reading `process.argv`, possibly making
network calls). A regression in flag parsing or validation would ship silently.
After this plan, the pure command-layer logic lives in an importable module
(matching the existing `fetch-png.ts` split) and is covered by unit tests.

## Current state

- `src/cli/index.ts` — CLI entry. Defines pure helpers `parseFlags`,
  `requireString`, `optionalPositiveInteger`, and the `preview` command's
  URL-building logic, then runs `await main()` at the bottom of the file.
  None of these helpers are exported; importing the module runs `main()`.
- `src/cli/fetch-png.ts` — the **convention to follow**: testable logic
  (`fetchPng`, `assertPngResponseHeaders`, `assertPngSignature`) lives in its
  own module with named exports, and `index.ts` imports it. `test/cli.test.ts`
  imports directly from `fetch-png.js`. Mirror this split for the arg logic.

Relevant excerpts from `src/cli/index.ts` as it exists today:

```ts
// top of file
#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { DEFAULT_MAX_BYTES, DEFAULT_TIMEOUT_MS, fetchPng } from "./fetch-png.js";
```

```ts
function preview(flags: Record<string, string | boolean>): void {
  const origin = String(flags.origin ?? "http://localhost:3000").replace(/\/+$/, "");
  const route = String(flags.route ?? "/api/og");
  const base = `${origin}${route.startsWith("/") ? route : `/${route}`}`;
  const examples = [
    ["Product", "eyebrow=Product&title=Ship+better+social+cards.&description=Code-rendered+Open+Graph+images."],
    ["Article", "eyebrow=Journal&title=Why+coded+OG+routes+beat+exported+PNGs&description=Typed+routes+stay+fresh."],
    ["Changelog", "eyebrow=v0.1.0&title=Initial+route+kit+release&description=Params%2C+metadata%2C+export."],
  ];

  for (const [label, query] of examples) {
    console.log(`${label}: ${base}?${query}`);
  }
}
```

```ts
function parseFlags(values: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];

    if (!token?.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = values[index + 1];

    if (next && !next.startsWith("--")) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }

  return flags;
}

function requireString(flags: Record<string, string | boolean>, key: string): string {
  const value = flags[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required flag --${key}`);
  }

  return value;
}

function optionalPositiveInteger(
  flags: Record<string, string | boolean>,
  key: string,
  fallback: number,
): number {
  const value = flags[key];

  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string") {
    throw new Error(`Flag --${key} requires a positive integer`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Flag --${key} requires a positive integer`);
  }

  return parsed;
}

await main();
```

The misleading test (finding #2), from `test/core.test.ts` (the
`describe("buildOgImageUrl", ...)` block):

```ts
  it("extends an existing array key without losing prior entries", () => {
    expect(buildOgImageUrl("/api/og?tag=old", { tag: ["new"] })).toBe("/api/og?tag=new");
  });
```

The name claims the prior `tag=old` is preserved; the assertion shows it is
replaced (`buildOgImageUrl` calls `searchParams.delete(key)` before appending —
see `src/core/image-url.ts:21`). The behavior is correct; only the name lies.

Repo conventions to match:
- Test files use Vitest: `import { describe, expect, it } from "vitest";`. See
  `test/cli.test.ts` and `test/core.test.ts` for structure.
- Source imports use the `.js` extension on relative paths (ESM +
  `verbatimModuleSyntax`), e.g. `from "./fetch-png.js"`. Match this exactly.
- `tsconfig.json` enables `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` — array/record indexing yields `T | undefined`;
  handle it (the existing code already does, e.g. `values[index]` guarded by
  `?.`).
- Type the flags bag as `Record<string, string | boolean>` (the existing
  alias). You may introduce `type Flags = Record<string, string | boolean>` in
  the new module and re-use it.

## Commands you will need

| Purpose   | Command                          | Expected on success         |
|-----------|----------------------------------|-----------------------------|
| Install   | `pnpm install --frozen-lockfile` | exit 0                      |
| Typecheck | `pnpm typecheck`                 | exit 0, no errors           |
| Tests     | `pnpm test`                      | all pass                    |
| Tests (1) | `pnpm test cli`                  | `test/cli.test.ts` passes   |
| Build     | `pnpm build`                     | exit 0 (sanity, optional)   |

## Scope

**In scope** (the only files you should modify or create):
- `src/cli/args.ts` (create) — pure, exported command-layer helpers
- `src/cli/index.ts` (modify) — import the helpers instead of defining them
- `test/cli.test.ts` (modify) — add a `describe` block for the new module
- `test/core.test.ts` (modify) — rename the one misleading test (finding #2)

**Out of scope** (do NOT touch):
- `src/cli/fetch-png.ts` — already tested; no change needed.
- `tsup.config.ts` — the new `args.ts` is imported by `index.ts`, so it is
  bundled into `cli/index` automatically. Do NOT add a new entry point.
- `package.json` exports/bin — `args.ts` is internal; it must NOT become a
  public entry.
- Any behavior change to `parseFlags` / `requireString` /
  `optionalPositiveInteger` / preview output. This is a **pure extraction +
  tests**. The functions must behave identically after the move.

## Git workflow

- Branch: `advisor/001-cli-arg-coverage` (the executor's worktree is already on
  its own branch; commit there).
- One commit is fine. Message style matches `git log` (short imperative
  subject, no body required), e.g. `Unit-test CLI argument and preview logic`.
- Do NOT push or open a PR.

## Steps

### Step 1: Extract pure helpers into `src/cli/args.ts`

Create `src/cli/args.ts` exporting these four functions, moved **verbatim** in
behavior from `index.ts`. Add a `Flags` type alias and a `buildPreviewUrls`
function that returns the lines `preview` currently prints (so the URL logic
becomes testable without capturing `console.log`):

```ts
export type Flags = Record<string, string | boolean>;

const PREVIEW_EXAMPLES: ReadonlyArray<readonly [string, string]> = [
  ["Product", "eyebrow=Product&title=Ship+better+social+cards.&description=Code-rendered+Open+Graph+images."],
  ["Article", "eyebrow=Journal&title=Why+coded+OG+routes+beat+exported+PNGs&description=Typed+routes+stay+fresh."],
  ["Changelog", "eyebrow=v0.1.0&title=Initial+route+kit+release&description=Params%2C+metadata%2C+export."],
];

export function parseFlags(values: string[]): Flags {
  // ...moved verbatim from index.ts...
}

export function requireString(flags: Flags, key: string): string {
  // ...moved verbatim...
}

export function optionalPositiveInteger(flags: Flags, key: string, fallback: number): number {
  // ...moved verbatim...
}

export function buildPreviewUrls(flags: Flags): string[] {
  const origin = String(flags.origin ?? "http://localhost:3000").replace(/\/+$/, "");
  const route = String(flags.route ?? "/api/og");
  const base = `${origin}${route.startsWith("/") ? route : `/${route}`}`;
  return PREVIEW_EXAMPLES.map(([label, query]) => `${label}: ${base}?${query}`);
}
```

**Verify**: `pnpm typecheck` → exit 0, no errors.

### Step 2: Rewire `src/cli/index.ts` to import from `args.ts`

Remove the now-duplicated `parseFlags`, `requireString`, and
`optionalPositiveInteger` definitions from `index.ts`. Replace the body of
`preview` so it prints `buildPreviewUrls(flags)`:

```ts
function preview(flags: Flags): void {
  for (const line of buildPreviewUrls(flags)) {
    console.log(line);
  }
}
```

Add the import near the existing `fetch-png.js` import:

```ts
import { buildPreviewUrls, optionalPositiveInteger, parseFlags, requireString } from "./args.js";
import type { Flags } from "./args.js";
```

Update the local `Record<string, string | boolean>` annotations on
`exportImage`/`checkImage`/`preview` to use `Flags` for consistency (optional
but preferred). Leave `main`, `exportImage`, `checkImage`, `help`, and the
trailing `await main();` unchanged.

**Verify**: `pnpm typecheck` → exit 0. Then `pnpm build` → exit 0 (confirms the
bin still bundles).

### Step 3: Add unit tests in `test/cli.test.ts`

Append a new `describe("CLI args", ...)` block (do not disturb the existing
`fetch-png` tests). Import from `../src/cli/args.js`. Cover:

- `parseFlags`:
  - `["--url", "x", "--out", "y"]` → `{ url: "x", out: "y" }`
  - `["--verbose"]` (no following value) → `{ verbose: true }`
  - `["--a", "--b"]` (value position is itself a flag) → `{ a: true, b: true }`
  - leading non-flag tokens are ignored: `["export", "--url", "x"]` → `{ url: "x" }`
  - a `-5`-style value is taken as a value (only `--` starts a flag):
    `["--max-bytes", "-5"]` → `{ "max-bytes": "-5" }`
- `requireString`:
  - present non-empty string → returns it
  - missing key → throws `/Missing required flag --url/`
  - boolean `true` value → throws
  - empty string → throws
- `optionalPositiveInteger`:
  - missing key → returns the fallback
  - `"10"` → `10`
  - `"0"` throws, `"-5"` throws, `"5.5"` throws, `"abc"` throws
  - boolean `true` → throws
- `buildPreviewUrls`:
  - defaults → 3 lines, each starting with `Product: `/`Article: `/`Changelog: `
    and containing `http://localhost:3000/api/og?`
  - `{ origin: "https://x.dev/", route: "og" }` → base is
    `https://x.dev/og?...` (trailing slash on origin stripped, missing leading
    slash on route added)

Model the structure on the existing `describe`/`it`/`expect` blocks in this
file. Each assertion must check a concrete value or a specific thrown message —
no `expect(true).toBe(true)` filler.

**Verify**: `pnpm test cli` → all pass, including the new `CLI args` cases.

### Step 4: Fix the misleading test name (finding #2)

In `test/core.test.ts`, in the `describe("buildOgImageUrl", ...)` block, rename
the `it("extends an existing array key without losing prior entries", ...)`
case to describe what it actually asserts. Keep the assertion unchanged:

```ts
  it("replaces an existing key with the provided array values", () => {
    expect(buildOgImageUrl("/api/og?tag=old", { tag: ["new"] })).toBe("/api/og?tag=new");
  });
```

**Verify**: `pnpm test core` → all pass.

## Test plan

- New: `describe("CLI args", ...)` in `test/cli.test.ts` covering `parseFlags`,
  `requireString`, `optionalPositiveInteger`, and `buildPreviewUrls` (cases
  enumerated in Step 3). Structural pattern: the existing blocks in the same
  file.
- Changed: one rename in `test/core.test.ts` (Step 4), no assertion change.
- Verification: `pnpm test` → all pass; the new `CLI args` block reports its
  cases.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0; the `CLI args` describe block exists in
      `test/cli.test.ts` and its cases pass
- [ ] `pnpm build` exits 0
- [ ] `src/cli/args.ts` exists and exports `parseFlags`, `requireString`,
      `optionalPositiveInteger`, `buildPreviewUrls`
- [ ] `grep -n "function parseFlags" src/cli/index.ts` returns no match (the
      definition moved out)
- [ ] `grep -n "extends an existing array key" test/core.test.ts` returns no
      match
- [ ] `git status --porcelain` shows changes only to the four in-scope paths
- [ ] `plans/README.md` status row updated (skip if your reviewer maintains it)

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows `src/cli/index.ts` or `test/core.test.ts` changed since
  `70e8e93` and the "Current state" excerpts no longer match.
- `tsup` build fails because `args.ts` needs an entry point — it should not; if
  it does, the bundling assumption is wrong, so STOP rather than editing
  `tsup.config.ts`.
- Extracting a helper changes any existing test's result (the extraction is
  meant to be behavior-neutral).
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- For a reviewer: confirm the three extracted helpers are byte-for-byte
  behavior-identical (this is an extraction, not a rewrite) and that the new
  tests assert real values, not tautologies.
- `args.ts` is internal — if a future change exposes a CLI programmatic API, it
  should get its own public entry in `package.json` exports + `tsup.config.ts`;
  do not let `args.ts` leak into the public surface implicitly.
- If `parseFlags` ever needs to support `--key=value` syntax or short flags,
  the tests in Step 3 are the place to pin the new behavior first.
