#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

type Command = "export" | "check" | "preview" | "help";

const args = process.argv.slice(2);
const command = (args[0] ?? "help") as Command;
const flags = parseFlags(args.slice(1));

try {
  if (command === "export") {
    await exportImage(flags);
  } else if (command === "check") {
    await checkImage(flags);
  } else if (command === "preview") {
    preview(flags);
  } else {
    help();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function exportImage(flags: Record<string, string | boolean>): Promise<void> {
  const url = requireString(flags, "url");
  const out = requireString(flags, "out");
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("image/png")) {
    throw new Error(`Export failed: expected image/png, received ${contentType || "unknown content type"}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, bytes);
  console.log(`Wrote ${bytes.byteLength} bytes to ${out}`);
}

async function checkImage(flags: Record<string, string | boolean>): Promise<void> {
  const url = requireString(flags, "url");
  const maxBytes = Number(flags["max-bytes"] ?? 8_000_000);
  const response = await fetch(url);
  const contentType = response.headers.get("content-type") ?? "";
  const bytes = new Uint8Array(await response.arrayBuffer());

  if (!response.ok) {
    throw new Error(`Check failed: ${response.status} ${response.statusText}`);
  }

  if (!contentType.toLowerCase().includes("image/png")) {
    throw new Error(`Check failed: expected image/png, received ${contentType || "unknown content type"}`);
  }

  if (bytes.byteLength > maxBytes) {
    throw new Error(`Check failed: image is ${bytes.byteLength} bytes, above max ${maxBytes}`);
  }

  console.log(`OK ${response.status} ${contentType} ${bytes.byteLength} bytes`);
}

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

function help(): void {
  console.log(`og-route-kit

Commands:
  export --url <url> --out <path>       Fetch a PNG route and write it to disk
  check --url <url> [--max-bytes <n>]   Verify a PNG route is healthy
  preview [--origin <url>] [--route <path>]
                                        Print local preview URLs
`);
}

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
