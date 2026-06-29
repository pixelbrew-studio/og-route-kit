import { createSocialMetadata } from "og-route-kit/next";

export const social = createSocialMetadata({
  siteUrl: "http://localhost:3000",
  siteName: "og-route-kit",
  imageRoute: "/api/og",
  defaultImage: "/og-image.png",
});
