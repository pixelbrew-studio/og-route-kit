import { createOgRoute } from "og-route-kit/next";
import { ProductOgCard } from "@/og/ProductOgCard";

export const runtime = "edge";

export const GET = createOgRoute({
  size: "og",
  defaults: {
    eyebrow: "Product",
    title: "Ship better social cards.",
    description: "Code-rendered Open Graph images for Next.js product pages.",
  },
  fields: {
    eyebrow: { max: 80 },
    title: { max: 140, required: true },
    description: { max: 180 },
  },
  render: ProductOgCard,
});
