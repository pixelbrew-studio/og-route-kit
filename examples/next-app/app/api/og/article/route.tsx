import { createOgRoute } from "og-route-kit/next";
import { ArticleOgCard } from "@/og/ArticleOgCard";

export const runtime = "edge";

export const GET = createOgRoute({
  size: "og",
  defaults: {
    eyebrow: "Journal",
    title: "Why coded OG routes beat exported PNGs",
    description: "Typed routes stay in sync with your content. No stale assets.",
  },
  fields: {
    eyebrow: { max: 80 },
    title: { max: 140, required: true },
    description: { max: 180 },
  },
  render: ArticleOgCard,
});
