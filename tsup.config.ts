import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "next/index": "src/next/index.ts",
    "cli/index": "src/cli/index.ts",
    "examples/cards/index": "src/examples/cards/index.ts",
  },
  clean: true,
  dts: true,
  external: ["next", "next/og.js", "react", "react/jsx-runtime"],
  format: ["esm"],
  shims: true,
  sourcemap: true,
  splitting: false,
});
