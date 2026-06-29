export type OgField = {
  required?: boolean;
  max?: number;
  fallback?: string;
  collapseWhitespace?: boolean;
};

export type OgFields<T extends Record<string, string>> = Partial<Record<keyof T, OgField>>;
