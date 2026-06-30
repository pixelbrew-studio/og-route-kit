#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { DEFAULT_MAX_BYTES, DEFAULT_TIMEOUT_MS, fetchPng } from "./fetch-png.js";
import { buildPreviewUrls, optionalPositiveInteger, parseFlags, requireString } from "./args.js";
import type { Flags } from "./args.js";

type Command = "export" | "check" | "preview" | "help";

async function main(): Promise<void> {
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
}

async function exportImage(flags: Flags): Promise<void> {
  const url = requireString(flags, "url");
  const out = requireString(flags, "out");
  const maxBytes = optionalPositiveInteger(flags, "max-bytes", DEFAULT_MAX_BYTES);
  const timeoutMs = optionalPositiveInteger(flags, "timeout", DEFAULT_TIMEOUT_MS);

  let bytes: Uint8Array;

  try {
    bytes = await fetchPng(url, { maxBytes, timeoutMs });
  } catch (error) {
    throw new Error(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, bytes);
  console.log(`Wrote ${bytes.byteLength} bytes to ${out}`);
}

async function checkImage(flags: Flags): Promise<void> {
  const url = requireString(flags, "url");
  const maxBytes = optionalPositiveInteger(flags, "max-bytes", DEFAULT_MAX_BYTES);
  const timeoutMs = optionalPositiveInteger(flags, "timeout", DEFAULT_TIMEOUT_MS);

  let bytes: Uint8Array;

  try {
    bytes = await fetchPng(url, { maxBytes, timeoutMs });
  } catch (error) {
    throw new Error(`Check failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log(`OK 200 image/png ${bytes.byteLength} bytes`);
}

function preview(flags: Flags): void {
  for (const line of buildPreviewUrls(flags)) {
    console.log(line);
  }
}

function help(): void {
  console.log(`og-route-kit

Commands:
  export --url <url> --out <path> [--max-bytes <n>] [--timeout <ms>]
                                        Fetch a PNG route and write it to disk
  check --url <url> [--max-bytes <n>] [--timeout <ms>]
                                        Verify a PNG route is healthy
  preview [--origin <url>] [--route <path>]
                                        Print local preview URLs
`);
}

await main();
