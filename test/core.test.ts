import { describe, expect, it } from "vitest";

import { buildOgImageUrl, DEFAULT_OG_PARAM_MAX, normalizeOgParams, OgParamError, resolveOgImageSize } from "../src/core/index.js";

describe("normalizeOgParams", () => {
  it("uses defaults for missing, empty, and whitespace-only values", () => {
    const params = normalizeOgParams(new URLSearchParams("title=&description=%20%20%20"), {
      defaults: {
        eyebrow: "Acme",
        title: "Default title",
        description: "Default description",
      },
    });

    expect(params).toEqual({
      eyebrow: "Acme",
      title: "Default title",
      description: "Default description",
    });
  });

  it("collapses repeated whitespace by default", () => {
    const params = normalizeOgParams(new URLSearchParams("title=Hello%0A%09%20world"), {
      defaults: {
        title: "Default title",
      },
    });

    expect(params.title).toBe("Hello world");
  });

  it("can preserve internal whitespace when requested", () => {
    const params = normalizeOgParams(new URLSearchParams("title=Hello%0A%09%20world"), {
      defaults: {
        title: "Default title",
      },
      fields: {
        title: { collapseWhitespace: false },
      },
    });

    expect(params.title).toBe("Hello\n\t world");
  });

  it("truncates values and fallbacks deterministically", () => {
    const params = normalizeOgParams(new URLSearchParams("title=abcdef"), {
      defaults: {
        title: "Default title",
        description: "fallback",
      },
      fields: {
        title: { max: 3 },
        description: { max: 4 },
      },
    });

    expect(params).toEqual({
      title: "abc",
      description: "fall",
    });
  });

  it("caps a field with no explicit max at the default to bound renderer input", () => {
    const oversized = "a".repeat(DEFAULT_OG_PARAM_MAX + 100);
    const params = normalizeOgParams(new URLSearchParams(`title=${oversized}`), {
      defaults: { title: "Default title" },
    });

    expect(params.title).toHaveLength(DEFAULT_OG_PARAM_MAX);
  });

  it("caps raw query input before whitespace normalization", () => {
    const oversized = `${"a".repeat(DEFAULT_OG_PARAM_MAX)} b`;
    const params = normalizeOgParams(new URLSearchParams(`title=${oversized}`), {
      defaults: { title: "Default title" },
    });

    expect(params.title).toBe("a".repeat(DEFAULT_OG_PARAM_MAX));
  });

  it("preserves decoded punctuation", () => {
    const params = normalizeOgParams(new URLSearchParams("title=Why+%E2%80%9Cquotes%E2%80%9D+matter%3F"), {
      defaults: {
        title: "Default title",
      },
    });

    expect(params.title).toBe("Why “quotes” matter?");
  });

  it("fails clearly for a required field without fallback", () => {
    expect(() =>
      normalizeOgParams(new URLSearchParams(), {
        defaults: {
          title: "",
        },
        fields: {
          title: { required: true },
        },
      }),
    ).toThrow(OgParamError);
  });
});

describe("buildOgImageUrl", () => {
  it("encodes params with deterministic URLSearchParams encoding", () => {
    expect(
      buildOgImageUrl("/api/og", {
        eyebrow: "Acme Blog",
        title: "Why every judgment cites a quote",
      }),
    ).toBe("/api/og?eyebrow=Acme+Blog&title=Why+every+judgment+cites+a+quote");
  });

  it("preserves existing query params and hash fragments", () => {
    expect(buildOgImageUrl("/api/og?theme=dark#card", { title: "Hello world" })).toBe(
      "/api/og?theme=dark&title=Hello+world#card",
    );
  });

  it("replaces an existing key and skips nullish values", () => {
    expect(buildOgImageUrl("/api/og?title=Old&theme=dark", { title: "New", empty: null })).toBe(
      "/api/og?theme=dark&title=New",
    );
  });

  it("encodes array values as repeated query keys", () => {
    expect(buildOgImageUrl("/api/og", { tag: ["a", "b", "c"] })).toBe(
      "/api/og?tag=a&tag=b&tag=c",
    );
  });

  it("extends an existing array key without losing prior entries", () => {
    expect(buildOgImageUrl("/api/og?tag=old", { tag: ["new"] })).toBe("/api/og?tag=new");
  });
});

describe("normalizeOgParams — fallback capping", () => {
  it("applies DEFAULT_OG_PARAM_MAX to a field's fallback when no explicit max is set", () => {
    const longFallback = "x".repeat(DEFAULT_OG_PARAM_MAX + 10);
    const params = normalizeOgParams(new URLSearchParams("title="), {
      defaults: { title: longFallback },
    });

    expect(params.title).toHaveLength(DEFAULT_OG_PARAM_MAX);
  });

  it("still honors an explicit field max when capping the fallback", () => {
    const params = normalizeOgParams(new URLSearchParams("title="), {
      defaults: { title: "abcdef" },
      fields: { title: { max: 3 } },
    });

    expect(params.title).toBe("abc");
  });
});

describe("resolveOgImageSize", () => {
  it("resolves named presets", () => {
    expect(resolveOgImageSize("og")).toEqual({ width: 1200, height: 630 });
    expect(resolveOgImageSize("twitter")).toEqual({ width: 1200, height: 675 });
    expect(resolveOgImageSize("square")).toEqual({ width: 1200, height: 1200 });
  });
});
