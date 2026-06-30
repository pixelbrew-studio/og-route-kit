import type { OgFields } from "./fields";
import { normalizeText } from "./text";

export type OgSearchParamsInput =
  | URLSearchParams
  | Iterable<[string, string]>
  | Record<string, string | string[] | null | undefined>;

export type NormalizeOgParamsOptions<T extends Record<string, string>> = {
  defaults: T;
  fields?: OgFields<T> | undefined;
};

// Caps untrusted query input that reaches the renderer when a field omits an
// explicit max, so an unconfigured field can't accept multi-megabyte values.
// Override per field with `fields[key].max`.
export const DEFAULT_OG_PARAM_MAX = 512;

export class OgParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OgParamError";
  }
}

export function normalizeOgParams<T extends Record<string, string>>(
  input: OgSearchParamsInput,
  options: NormalizeOgParamsOptions<T>,
): T {
  const searchParams = toURLSearchParams(input);
  const output: Record<string, string> = {};

  for (const key of Object.keys(options.defaults) as Array<keyof T & string>) {
    const field = options.fields?.[key];
    const rawValue = searchParams.get(key);
    const fallback = field?.fallback ?? options.defaults[key] ?? "";
    const max = resolveMax(field?.max);
    const normalizedValue =
      rawValue == null
        ? ""
        : normalizeText(rawValue.slice(0, max), { collapseWhitespace: field?.collapseWhitespace });

    if (normalizedValue.length > 0) {
      output[key] = applyMax(normalizedValue, max);
      continue;
    }

    const normalizedFallback = normalizeText(fallback, {
      collapseWhitespace: field?.collapseWhitespace,
      max: field?.max,
    });

    if (normalizedFallback.length > 0) {
      output[key] = normalizedFallback;
      continue;
    }

    if (field?.required) {
      throw new OgParamError(`Missing required OG image field: ${key}`);
    }

    output[key] = "";
  }

  return output as T;
}

function applyMax(value: string, max: number | undefined): string {
  return value.slice(0, resolveMax(max));
}

function resolveMax(max: number | undefined): number {
  if (max === undefined) {
    return DEFAULT_OG_PARAM_MAX;
  }

  return Number.isSafeInteger(max) && max > 0 ? max : DEFAULT_OG_PARAM_MAX;
}

function toURLSearchParams(input: OgSearchParamsInput): URLSearchParams {
  if (input instanceof URLSearchParams) {
    return input;
  }

  const params = new URLSearchParams();

  if (isIterablePairs(input)) {
    for (const [key, value] of input) {
      params.append(key, value);
    }

    return params;
  }

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    if (value != null) {
      params.set(key, value);
    }
  }

  return params;
}

function isIterablePairs(input: OgSearchParamsInput): input is Iterable<[string, string]> {
  return Symbol.iterator in Object(input);
}
