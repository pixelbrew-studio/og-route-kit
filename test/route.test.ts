import type { ReactElement } from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/og.js", () => ({
  ImageResponse: vi.fn(function MockImageResponse(
    this: { status: number; headers: Headers },
    _element: unknown,
    options?: { headers?: HeadersInit },
  ) {
    this.status = 200;
    this.headers = new Headers(options?.headers ?? {});
  }),
}));

import { ImageResponse } from "next/og.js";

import { createOgRoute, DEFAULT_CACHE_CONTROL } from "../src/next/index.js";

function fakeElement(): ReactElement {
  return { type: "div", props: { children: "x" }, key: null } as unknown as ReactElement;
}

const propsSeen = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

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

describe("createOgRoute GET — happy path", () => {
  it("normalizes query params and passes them to render", () => {
    const render = (props: { title: string; eyebrow: string }): ReactElement => {
      propsSeen(props);
      return fakeElement();
    };

    const GET = createOgRoute({
      defaults: { title: "Default title", eyebrow: "Acme" },
      fields: { title: { max: 10, required: true } },
      render,
    });

    GET(new Request("http://x/og?title=Hello%20World&eyebrow=A"));

    expect(propsSeen).toHaveBeenCalledWith({ title: "Hello Worl", eyebrow: "A" });
  });

  it("uses the default size and emits cache-control + nosniff headers", () => {
    const GET = createOgRoute({
      defaults: { title: "Default title" },
      render: () => fakeElement(),
    });

    const res = GET(new Request("http://x/og?title=Hi")) as unknown as {
      status: number;
      headers: Headers;
    };

    expect(res.status).toBe(200);
    expect(ImageResponse).toHaveBeenCalledTimes(1);
    const [, options] = (ImageResponse as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      unknown,
      { width: number; height: number; headers: Record<string, string> },
    ];
    expect(options).toMatchObject({ width: 1200, height: 630 });
    expect(res.headers.get("cache-control")).toBe(DEFAULT_CACHE_CONTROL);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("passes a named size preset through to ImageResponse options", () => {
    const GET = createOgRoute({
      size: "twitter",
      defaults: { title: "Default title" },
      render: () => fakeElement(),
    });

    GET(new Request("http://x/og?title=Hi"));

    const [, options] = (ImageResponse as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      unknown,
      { width: number; height: number },
    ];
    expect(options).toMatchObject({ width: 1200, height: 675 });
  });

  it("lets caller headers override defaults", () => {
    const GET = createOgRoute({
      defaults: { title: "Default title" },
      headers: { "Cache-Control": "public, max-age=3600" },
      render: () => fakeElement(),
    });

    const res = GET(new Request("http://x/og?title=Hi")) as unknown as { headers: Headers };

    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
  });
});

describe("createOgRoute — conservative default cache (Behavior 3)", () => {
  it("exposes a conservative DEFAULT_CACHE_CONTROL", () => {
    expect(DEFAULT_CACHE_CONTROL).toBe(
      "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    );
  });
});
