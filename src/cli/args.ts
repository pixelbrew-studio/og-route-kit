export type Flags = Record<string, string | boolean>;

const PREVIEW_EXAMPLES: ReadonlyArray<readonly [string, string]> = [
  ["Product", "eyebrow=Product&title=Ship+better+social+cards.&description=Code-rendered+Open+Graph+images."],
  ["Article", "eyebrow=Journal&title=Why+coded+OG+routes+beat+exported+PNGs&description=Typed+routes+stay+fresh."],
  ["Changelog", "eyebrow=v0.1.0&title=Initial+route+kit+release&description=Params%2C+metadata%2C+export."],
];

export function parseFlags(values: string[]): Flags {
  const flags: Flags = {};

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

export function requireString(flags: Flags, key: string): string {
  const value = flags[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required flag --${key}`);
  }

  return value;
}

export function optionalPositiveInteger(flags: Flags, key: string, fallback: number): number {
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

export function buildPreviewUrls(flags: Flags): string[] {
  const origin = String(flags.origin ?? "http://localhost:3000").replace(/\/+$/, "");
  const route = String(flags.route ?? "/api/og");
  const base = `${origin}${route.startsWith("/") ? route : `/${route}`}`;
  return PREVIEW_EXAMPLES.map(([label, query]) => `${label}: ${base}?${query}`);
}
