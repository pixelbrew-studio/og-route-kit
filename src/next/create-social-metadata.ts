import type { Metadata } from "next";

import { buildOgImageUrl, resolveOgImageSize } from "../core/index";
import type { OgImageSizeInput, OgImageUrlParams } from "../core/index";

export type CreateSocialMetadataOptions = {
  siteUrl: string;
  siteName: string;
  twitter?: string | undefined;
  imageRoute: string;
  defaultImage?: string | undefined;
  includeDefaultImageFallback?: boolean | undefined;
  imageSize?: OgImageSizeInput | undefined;
  defaultImageSize?: OgImageSizeInput | undefined;
};

export type WebsiteMetadataInput = {
  title: string;
  description: string;
  path?: string | undefined;
  image?: OgImageUrlParams | undefined;
  imageAlt?: string | undefined;
};

export type ArticleMetadataInput = WebsiteMetadataInput & {
  publishedTime?: string | undefined;
  modifiedTime?: string | undefined;
  authors?: string[] | undefined;
};

export function createSocialMetadata(options: CreateSocialMetadataOptions) {
  const siteUrl = normalizeOrigin(options.siteUrl);

  return {
    website(input: WebsiteMetadataInput): Metadata {
      return buildMetadata("website", siteUrl, options, input);
    },
    article(input: ArticleMetadataInput): Metadata {
      return buildMetadata("article", siteUrl, options, input);
    },
  };
}

function buildMetadata(
  type: "website" | "article",
  siteUrl: string,
  options: CreateSocialMetadataOptions,
  input: WebsiteMetadataInput | ArticleMetadataInput,
): Metadata {
  const pageUrl = absoluteUrl(siteUrl, input.path ?? "/");
  const images = resolveSocialImages(siteUrl, options, input);
  const title = input.title;
  const description = input.description;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type,
      url: pageUrl,
      title,
      description,
      siteName: options.siteName,
      images,
      ...(type === "article" ? articleFields(input as ArticleMetadataInput) : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: options.twitter,
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

type SocialImageMetadata = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

function resolveSocialImages(
  siteUrl: string,
  options: CreateSocialMetadataOptions,
  input: WebsiteMetadataInput,
): SocialImageMetadata[] {
  const imageSize = resolveOgImageSize(options.imageSize ?? "og");
  const fallbackSize = resolveOgImageSize(options.defaultImageSize ?? options.imageSize ?? "og");
  const alt = input.imageAlt ?? input.title;
  const defaultImage = options.defaultImage
    ? {
        url: absoluteUrl(siteUrl, options.defaultImage),
        alt,
        ...fallbackSize,
      }
    : undefined;

  if (input.image) {
    const url = absoluteUrl(siteUrl, buildOgImageUrl(options.imageRoute, input.image));
    const routeImage = {
      url,
      alt,
      ...imageSize,
    };

    return options.includeDefaultImageFallback && defaultImage
      ? [routeImage, defaultImage]
      : [routeImage];
  }

  if (defaultImage) {
    return [defaultImage];
  }

  return [
    {
      url: absoluteUrl(
        siteUrl,
        buildOgImageUrl(options.imageRoute, { title: input.title, description: input.description }),
      ),
      alt,
      ...imageSize,
    },
  ];
}

function articleFields(input: ArticleMetadataInput): Record<string, unknown> {
  return {
    ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    ...(input.authors ? { authors: input.authors } : {}),
  };
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

function absoluteUrl(origin: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
