import { readFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import path from "node:path";

export type ReleaseAsset = {
  name: string;
  size: number;
  url: string;
};

export type UpdaterAsset = ReleaseAsset & {
  /** Tauri minisign signature over the .nsis.zip payload. */
  signature: string;
};

export type Release = {
  version: string;
  notes: string;
  pubDate: string;
  installer: ReleaseAsset;
  updater: UpdaterAsset;
};

/** Tauri v1-style updater manifest served to the app. */
export type UpdaterManifest = {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<
    "windows-x86_64",
    { signature: string; url: string }
  >;
};

export const BLOB_MANIFEST_PATH = "release/latest.json";
export const SEED_MANIFEST_PATH = path.join(process.cwd(), "content", "release.json");

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Absolute URL for a stored asset, so the app and browser never depend on the caller's origin. */
export function absoluteUrl(url: string, requestUrl?: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    (requestUrl ? new URL(requestUrl).origin : undefined) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return new URL(url, base).toString();
}

export function toManifest(release: Release, origin?: string): UpdaterManifest {
  return {
    version: release.version,
    notes: release.notes,
    pub_date: release.pubDate,
    platforms: {
      "windows-x86_64": {
        signature: release.updater.signature,
        url: absoluteUrl(release.updater.url, origin),
      },
    },
  };
}

export async function readRelease(): Promise<Release> {
  if (isBlobConfigured()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: BLOB_MANIFEST_PATH, limit: 1 });
      const blob = blobs.find((entry) => entry.pathname === BLOB_MANIFEST_PATH);
      if (blob) {
        const response = await fetch(blob.url, { cache: "no-store" });
        if (response.ok) return (await response.json()) as Release;
      }
    } catch (error) {
      console.error("Reading release metadata from Vercel Blob failed", error);
    }
  }
  const raw = await readFile(SEED_MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as Release;
}

export async function writeRelease(release: Release): Promise<string> {
  const { put } = await import("@vercel/blob");
  const blob = await put(BLOB_MANIFEST_PATH, JSON.stringify(release, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return blob.url;
}

/**
 * Stores a release asset next to the manifest and returns its public URL.
 * Assets are uploaded one request at a time so each stays under the 4.5 MB
 * serverless body limit.
 */
export async function writeAsset(
  name: string,
  contentType: string,
  body: ArrayBuffer,
): Promise<ReleaseAsset> {
  const { put } = await import("@vercel/blob");
  const blob = await put(`release/${name}`, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
  return { name, size: body.byteLength, url: blob.url };
}

export function requireReleaseToken(request: Request): void {
  const expected = process.env.RELEASE_TOKEN;
  if (!expected) throw new HttpError(503, "RELEASE_TOKEN is not configured");

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) throw new HttpError(401, "Invalid release token");
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
