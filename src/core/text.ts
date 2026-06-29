export type NormalizeTextOptions = {
  collapseWhitespace?: boolean | undefined;
  max?: number | undefined;
};

export function normalizeText(value: string, options: NormalizeTextOptions = {}): string {
  const collapseWhitespace = options.collapseWhitespace ?? true;
  const trimmed = value.trim();
  const normalized = collapseWhitespace ? trimmed.replace(/\s+/g, " ") : trimmed;

  if (typeof options.max === "number") {
    return normalized.slice(0, options.max);
  }

  return normalized;
}
