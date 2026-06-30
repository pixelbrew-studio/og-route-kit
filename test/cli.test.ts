import { afterEach, describe, expect, it, vi } from "vitest";

import { assertPngResponseHeaders, assertPngSignature, fetchPng } from "../src/cli/fetch-png.js";

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngResponse(extra: Uint8Array = new Uint8Array([0, 1, 2, 3])): Uint8Array {
  return new Uint8Array([...PNG_SIGNATURE, ...extra]);
}

function makeResponse(init: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  contentType?: string;
  contentLength?: string;
  body?: Uint8Array;
  chunks?: Uint8Array[];
  onBodyRead?: () => void;
  onCancel?: () => void;
}): Response {
  const headers = new Map<string, string>();
  if (init.contentType !== undefined) headers.set("content-type", init.contentType);
  if (init.contentLength !== undefined) headers.set("content-length", init.contentLength);

  const chunks = init.chunks ?? [init.body ?? pngResponse()];
  let chunkIndex = 0;
  const stream = {
    getReader: () => ({
      read: async () => {
        init.onBodyRead?.();
        const chunk = chunks[chunkIndex];

        if (chunk) {
          chunkIndex += 1;
          return { done: false, value: chunk };
        }

        return { done: true, value: undefined };
      },
      cancel: async () => {
        init.onCancel?.();
      },
      releaseLock: () => {},
    }),
  };

  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
    },
    body: stream,
    arrayBuffer: async () => {
      init.onBodyRead?.();
      const body = init.body ?? pngResponse();
      return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    },
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("assertPngResponseHeaders", () => {
  it("throws on a not-ok response without reading the body", () => {
    const response = makeResponse({ ok: false, status: 502, statusText: "Bad Gateway", contentType: "image/png" });
    expect(() => assertPngResponseHeaders(response, 8_000_000)).toThrow(/502/);
  });

  it("throws when content-type is not image/png", () => {
    const response = makeResponse({ contentType: "text/html" });
    expect(() => assertPngResponseHeaders(response, 8_000_000)).toThrow(/image\/png/);
  });

  it("throws when Content-Length exceeds the byte cap", () => {
    const response = makeResponse({ contentType: "image/png", contentLength: "9000000" });
    expect(() => assertPngResponseHeaders(response, 8_000_000)).toThrow(/max/i);
  });

  it("passes for an ok image/png response within the cap", () => {
    const response = makeResponse({ contentType: "image/png", contentLength: "100" });
    expect(() => assertPngResponseHeaders(response, 8_000_000)).not.toThrow();
  });
});

describe("assertPngSignature", () => {
  it("throws when bytes do not start with the PNG signature", () => {
    expect(() => assertPngSignature(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]))).toThrow(/PNG/);
  });

  it("accepts bytes that start with the PNG signature", () => {
    expect(() => assertPngSignature(pngResponse())).not.toThrow();
  });
});

describe("fetchPng", () => {
  it("rejects invalid byte caps before fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchPng("https://example.test/og.png", { maxBytes: Number.NaN })).rejects.toThrow(/maxBytes/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects invalid timeouts before fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchPng("https://example.test/og.png", { timeoutMs: 0 })).rejects.toThrow(/timeoutMs/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws on a not-ok response and never reads the body", async () => {
    let bodyRead = false;
    const response = makeResponse({
      ok: false,
      status: 404,
      statusText: "Not Found",
      contentType: "image/png",
      onBodyRead: () => {
        bodyRead = true;
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(fetchPng("https://example.test/og.png", {})).rejects.toThrow(/404/);
    expect(bodyRead).toBe(false);
  });

  it("throws when content-type is not image/png before reading the body", async () => {
    let bodyRead = false;
    const response = makeResponse({
      contentType: "text/html",
      onBodyRead: () => {
        bodyRead = true;
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(fetchPng("https://example.test/og.png", {})).rejects.toThrow(/image\/png/);
    expect(bodyRead).toBe(false);
  });

  it("throws when Content-Length exceeds maxBytes before reading the body", async () => {
    let bodyRead = false;
    const response = makeResponse({
      contentType: "image/png",
      contentLength: "9000000",
      onBodyRead: () => {
        bodyRead = true;
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(fetchPng("https://example.test/og.png", { maxBytes: 8_000_000 })).rejects.toThrow(/max/i);
    expect(bodyRead).toBe(false);
  });

  it("throws when the body is not a PNG even with a PNG content-type", async () => {
    const response = makeResponse({
      contentType: "image/png",
      body: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(fetchPng("https://example.test/og.png", {})).rejects.toThrow(/PNG/);
  });

  it("throws and cancels the stream when the body exceeds maxBytes while reading", async () => {
    let cancelled = false;
    const response = makeResponse({
      contentType: "image/png",
      chunks: [PNG_SIGNATURE, new Uint8Array([1, 2, 3, 4])],
      onCancel: () => {
        cancelled = true;
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(fetchPng("https://example.test/og.png", { maxBytes: 10 })).rejects.toThrow(/max/i);
    expect(cancelled).toBe(true);
  });

  it("returns the bytes for a valid small PNG", async () => {
    const body = pngResponse();
    const response = makeResponse({ contentType: "image/png", body });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    const bytes = await fetchPng("https://example.test/og.png", {});
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes.slice(0, 8))).toEqual(Array.from(PNG_SIGNATURE));
  });

  it("passes an AbortSignal to fetch for the timeout", async () => {
    const body = pngResponse();
    const response = makeResponse({ contentType: "image/png", body });
    const fetchSpy = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(response));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchPng("https://example.test/og.png", { timeoutMs: 1000 });
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});
