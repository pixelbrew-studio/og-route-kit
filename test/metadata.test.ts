import { describe, expect, it } from "vitest";

import { createSocialMetadata } from "../src/next/index.js";

describe("createSocialMetadata", () => {
  const social = createSocialMetadata({
    siteUrl: "https://acme.com/",
    siteName: "Acme",
    twitter: "@acme",
    imageRoute: "/api/og",
    defaultImage: "/og-image.png",
  });

  it("builds website Open Graph and Twitter metadata with generated image URLs", () => {
    const metadata = social.website({
      title: "Pricing",
      description: "Simple usage-based pricing.",
      path: "/pricing",
      imageAlt: "Pricing social card",
      image: {
        eyebrow: "Pricing",
        title: "Usage-based pricing.",
        description: "Start small. Scale when needed.",
      },
    });

    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "https://acme.com/pricing",
      siteName: "Acme",
      images: [
        {
          url: "https://acme.com/api/og?eyebrow=Pricing&title=Usage-based+pricing.&description=Start+small.+Scale+when+needed.",
          alt: "Pricing social card",
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      site: "@acme",
      images: [
        "https://acme.com/api/og?eyebrow=Pricing&title=Usage-based+pricing.&description=Start+small.+Scale+when+needed.",
      ],
    });
  });

  it("uses the static fallback image when no image params are supplied", () => {
    const metadata = social.website({
      title: "Home",
      description: "Home page.",
    });

    expect(metadata.openGraph).toMatchObject({
      images: [
        {
          url: "https://acme.com/og-image.png",
          alt: "Home",
          width: 1200,
          height: 630,
        },
      ],
    });
  });

  it("builds article-specific fields", () => {
    const metadata = social.article({
      title: "Launch",
      description: "Release notes.",
      path: "/blog/launch",
      publishedTime: "2026-06-29T12:00:00.000Z",
      modifiedTime: "2026-06-29T13:00:00.000Z",
      authors: ["Ada"],
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-06-29T12:00:00.000Z",
      modifiedTime: "2026-06-29T13:00:00.000Z",
      authors: ["Ada"],
    });
  });

  it("passes an absolute path through verbatim for canonical and og:url", () => {
    const metadata = social.website({
      title: "Cross-post",
      description: "Pinned elsewhere.",
      path: "https://blog.other.example/launch",
    });

    expect(metadata.alternates?.canonical).toBe("https://blog.other.example/launch");
    expect(metadata.openGraph?.url).toBe("https://blog.other.example/launch");
  });
});

describe("createSocialMetadata — defaultImage passthrough", () => {
  it("uses an absolute defaultImage URL verbatim instead of joining with siteUrl", () => {
    const absoluteDefault = createSocialMetadata({
      siteUrl: "https://acme.com",
      siteName: "Acme",
      imageRoute: "/api/og",
      defaultImage: "https://cdn.other.example/og.png",
    });

    const metadata = absoluteDefault.website({
      title: "T",
      description: "D",
    });

    const image = (metadata.openGraph?.images as Array<{ url: string }>)[0];
    expect(image?.url).toBe("https://cdn.other.example/og.png");
  });
});

describe("createSocialMetadata — auto-generated fallback image", () => {
  it("builds an OG image URL from the route when neither image nor defaultImage is set", () => {
    const noDefault = createSocialMetadata({
      siteUrl: "https://acme.com",
      siteName: "Acme",
      imageRoute: "/api/og",
    });

    const metadata = noDefault.website({
      title: "Fallback",
      description: "Generated from route params.",
    });

    const imageUrl = (metadata.openGraph?.images as Array<{ url: string }>)[0]?.url ?? "";
    expect(imageUrl).toContain("https://acme.com/api/og?");
    expect(imageUrl).toContain("title=Fallback");
    expect(imageUrl).toContain("description=Generated+from+route+params.");
  });
});

describe("createSocialMetadata — size differentiation", () => {
  it("uses imageSize when image params are supplied and defaultImageSize when falling back", () => {
    const sized = createSocialMetadata({
      siteUrl: "https://acme.com",
      siteName: "Acme",
      imageRoute: "/api/og",
      defaultImage: "/og-image.png",
      imageSize: { width: 1200, height: 675 },
      defaultImageSize: { width: 1080, height: 1080 },
    });

    const withImage = sized.website({
      title: "T",
      description: "D",
      image: { title: "Title", description: "Desc" },
    });
    const withImageEntry = (withImage.openGraph?.images as Array<{ width: number; height: number }>)[0];
    expect(withImageEntry).toMatchObject({ width: 1200, height: 675 });

    const fallback = sized.website({ title: "T", description: "D" });
    const fallbackEntry = (fallback.openGraph?.images as Array<{ width: number; height: number }>)[0];
    expect(fallbackEntry).toMatchObject({ width: 1080, height: 1080 });
  });
});
