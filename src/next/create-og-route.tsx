import type { ReactElement } from "react";
import { ImageResponse } from "next/og.js";

import { normalizeOgParams, resolveOgImageSize } from "../core/index";
import type { OgFields, OgImageSizeInput } from "../core/index";

export type CreateOgRouteOptions<T extends Record<string, string>> = {
  size?: OgImageSizeInput | undefined;
  defaults: T;
  fields?: OgFields<T> | undefined;
  headers?: HeadersInit | undefined;
  render: (props: T) => ReactElement;
};

export type OgRouteRequest = Request;

export function createOgRoute<T extends Record<string, string>>(options: CreateOgRouteOptions<T>) {
  return function GET(request: OgRouteRequest): ImageResponse {
    const url = new URL(request.url);
    const size = resolveOgImageSize(options.size);
    const props = normalizeOgParams(url.searchParams, {
      defaults: options.defaults,
      fields: options.fields,
    });

    return new ImageResponse(options.render(props), {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400",
        ...headersToRecord(options.headers),
      },
    });
  };
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}
