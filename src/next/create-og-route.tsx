import type { ReactElement } from "react";
import { ImageResponse } from "next/og.js";

import { normalizeOgParams, OgParamError, resolveOgImageSize } from "../core/index";
import type { OgFields, OgImageSizeInput } from "../core/index";

export const DEFAULT_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export type CreateOgRouteOptions<T extends Record<string, string>> = {
  size?: OgImageSizeInput | undefined;
  defaults: T;
  fields?: OgFields<T> | undefined;
  headers?: HeadersInit | undefined;
  render: (props: T) => ReactElement;
};

export type OgRouteRequest = Request;

export function createOgRoute<T extends Record<string, string>>(options: CreateOgRouteOptions<T>) {
  return function GET(request: OgRouteRequest): ImageResponse | Response {
    const url = new URL(request.url);
    const size = resolveOgImageSize(options.size);

    let props: T;
    try {
      props = normalizeOgParams(url.searchParams, {
        defaults: options.defaults,
        fields: options.fields,
      });
    } catch (error) {
      if (error instanceof OgParamError) {
        return new Response(`Bad request: ${error.message}`, {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
      throw error;
    }

    return new ImageResponse(options.render(props), {
      ...size,
      headers: {
        "Cache-Control": DEFAULT_CACHE_CONTROL,
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
