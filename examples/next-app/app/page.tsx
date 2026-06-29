import type { Metadata } from "next";

import { social } from "@/lib/social";

export const metadata: Metadata = social.website({
  title: "og-route-kit",
  description: "Code-rendered Open Graph image routes for Next.js.",
  path: "/",
  image: {
    eyebrow: "og-route-kit",
    title: "Code-rendered Open Graph routes.",
    description: "Typed params, metadata helpers, preview checks, and static export.",
  },
});

export default function Page() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", margin: "80px auto", maxWidth: 760 }}>
      <h1>og-route-kit example</h1>
      <p>Open /api/og to render the example image route.</p>
    </main>
  );
}
