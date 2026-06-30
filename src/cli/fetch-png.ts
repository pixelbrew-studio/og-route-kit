export const DEFAULT_MAX_BYTES = 8_000_000;
export const DEFAULT_TIMEOUT_MS = 30_000;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

export interface FetchPngOptions {
  maxBytes?: number;
  timeoutMs?: number;
}

export function assertPngResponseHeaders(response: Response, maxBytes: number): void {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("image/png")) {
    throw new Error(`Expected image/png, received ${contentType || "unknown content type"}`);
  }

  const contentLength = Number(response.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`Image is ${contentLength} bytes, above max ${maxBytes}`);
  }
}

export function assertPngSignature(bytes: Uint8Array): void {
  const matches =
    bytes.byteLength >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);

  if (!matches) {
    throw new Error("Response body is not a PNG (missing PNG signature)");
  }
}

export async function fetchPng(url: string, options: FetchPngOptions): Promise<Uint8Array> {
  const maxBytes = resolvePositiveInteger(options.maxBytes, DEFAULT_MAX_BYTES, "maxBytes");
  const timeoutMs = resolvePositiveInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, "timeoutMs");

  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });

  assertPngResponseHeaders(response, maxBytes);

  const bytes = await readResponseBody(response, maxBytes);

  assertPngSignature(bytes);

  return bytes;
}

function resolvePositiveInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;

  if (!Number.isSafeInteger(resolved) || resolved <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return resolved;
}

async function readResponseBody(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) {
    throw new Error("Response body is empty");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error(`Image is above max ${maxBytes} bytes`);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}
