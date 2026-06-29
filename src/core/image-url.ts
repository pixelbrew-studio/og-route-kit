export type OgImageUrlParams = Record<
  string,
  string | number | boolean | Array<string | number | boolean> | null | undefined
>;

export function buildOgImageUrl(route: string | URL, params: OgImageUrlParams = {}): string {
  const routeText = route.toString();
  const hashIndex = routeText.indexOf("#");
  const withoutHash = hashIndex >= 0 ? routeText.slice(0, hashIndex) : routeText;
  const hash = hashIndex >= 0 ? routeText.slice(hashIndex) : "";
  const queryIndex = withoutHash.indexOf("?");
  const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const existingQuery = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";
  const searchParams = new URLSearchParams(existingQuery);

  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }

    searchParams.delete(key);

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();

  return `${base}${query ? `?${query}` : ""}${hash}`;
}
