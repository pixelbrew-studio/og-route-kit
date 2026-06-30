import { createOgRoute } from "og-route-kit/next";
import { ChangelogOgCard } from "@/og/ChangelogOgCard";

export const runtime = "edge";

export const GET = createOgRoute({
  size: "og",
  defaults: {
    eyebrow: "v0.1.0",
    title: "Initial route kit release",
    description: "Params, metadata helpers, preview checks, and static export.",
  },
  fields: {
    eyebrow: { max: 80 },
    title: { max: 140, required: true },
    description: { max: 180 },
  },
  render: ChangelogOgCard,
});
