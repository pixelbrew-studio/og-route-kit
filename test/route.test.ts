import { describe, expect, it } from "vitest";

import { createOgRoute, DEFAULT_CACHE_CONTROL } from "../src/next/index.js";

describe("createOgRoute GET — required-field validation (Behavior 1)", () => {
  it("returns 400 with no-store and a plain-text body when a required field is missing", async () => {
    const GET = createOgRoute({
      defaults: { title: "" },
      fields: { title: { required: true } },
      render: () => {
        throw new Error("render must not run on a bad request");
      },
    });

    const res = GET(new Request("http://x/og"));

    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(400);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toMatch(/bad request/i);
  });
});

describe("createOgRoute — conservative default cache (Behavior 3)", () => {
  it("exposes a conservative DEFAULT_CACHE_CONTROL", () => {
    expect(DEFAULT_CACHE_CONTROL).toBe(
      "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    );
  });
});
