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
});
