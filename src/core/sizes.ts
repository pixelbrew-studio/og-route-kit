export type OgImageSize = {
  width: number;
  height: number;
};

export type OgImageSizeName = "og" | "twitter" | "square";

export const OG_IMAGE_SIZES = {
  og: { width: 1200, height: 630 },
  twitter: { width: 1200, height: 675 },
  square: { width: 1200, height: 1200 },
} as const satisfies Record<OgImageSizeName, OgImageSize>;

export type OgImageSizeInput = OgImageSize | OgImageSizeName;

export function resolveOgImageSize(size: OgImageSizeInput = "og"): OgImageSize {
  if (typeof size === "string") {
    return OG_IMAGE_SIZES[size];
  }

  return size;
}
