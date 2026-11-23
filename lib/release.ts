import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { compare, valid } from "semver";
import { z } from "zod";

export type ReleaseAsset = {
  name: string;
  size: number;
  url: string;
};

export type UpdaterAsset = ReleaseAsset & {
  /**
   * Tauri minisign signature over the updater payload. Tauri v2 uses the
   * signed NSIS installer `.exe`; `.nsis.zip` stays readable for older builds.
   */
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

export const ASSET_KINDS = ["installer", "updater"] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const MAX_INSTALLER_BYTES = 3_000_000;
export const MAX_UPDATER_BYTES = 4 * 1024 * 1024;

const SAFE_FILE_NAME = /^[A-Za-z0-9._+-]+$/;
const ASSET_FILE_PATTERNS = {
  installer: /\.exe$/i,
  updater: /\.(?:exe|nsis\.zip)$/i,
} satisfies Record<AssetKind, RegExp>;

const SemVerSchema = z
  .string()
  .refine((version) => valid(version) !== null, "Must be a valid semver version");

const SafeFileNameSchema = z
  .string()
  .min(1)
  .max(180)
  .regex(SAFE_FILE_NAME, "File name contains unsupported characters")
  .refine((name) => !name.startsWith("."), "File name cannot start with a dot");

const HttpsUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith("https://"), "Asset URL must use HTTPS");

const StoredUrlSchema = z.string().refine(
  (url) =>
    url.startsWith("/") ||
    (URL.canParse(url) && new URL(url).protocol === "https:"),
  "Asset URL must be root-relative or HTTPS",
);

const SignatureSchema = z
  .string()
  .min(1)
  .max(4000)
  .refine(isTauriSignature, "Signature must be a base64-encoded Tauri signature");

function assetSchema(urlSchema: z.ZodString, kind: AssetKind) {
  return z.object({
    name: SafeFileNameSchema.refine(
      (name) => ASSET_FILE_PATTERNS[kind].test(name),
      `Invalid file name for ${kind}`,
    ),
    size: z.number().int().positive(),
    url: urlSchema,
  });
}

export const ReleaseInputSchema = z.object({
  version: SemVerSchema,
  notes: z.string().max(2000).default(""),
  pubDate: z.iso.datetime().optional(),
  installer: assetSchema(HttpsUrlSchema, "installer"),
  updater: assetSchema(HttpsUrlSchema, "updater").extend({
    signature: SignatureSchema,
  }),
}).superRefine((release, context) => {
  const stem = `WinRecorder_${release.version}_x64-setup`;
  if (release.installer.name !== `${stem}.exe`) {
    context.addIssue({
      code: "custom",
      path: ["installer", "name"],
      message: "Installer name must match the release version",
    });
  }
  if (
    release.updater.name !== `${stem}.exe` &&
    release.updater.name !== `${stem}.nsis.zip`
  ) {
    context.addIssue({
      code: "custom",
      path: ["updater", "name"],
      message: "Updater name must match the release version",
    });
  }
});

const StoredReleaseSchema = z.object({
  version: SemVerSchema,
  notes: z.string().max(2000),
  pubDate: z.iso.datetime(),
  installer: assetSchema(StoredUrlSchema, "installer"),
  updater: assetSchema(StoredUrlSchema, "updater").extend({
    signature: SignatureSchema,
  }),
});

export type ReleaseAssetMetadata = {
  pathname: string;
  size: number;
  url: string;
};

export type ReleaseReadResult = {
  release: Release;
  etag?: string;
  manifestUrl?: string;
  stored: boolean;
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
    const stored = await readBlobRelease();
    if (stored) return stored.release;
  }
  return readSeedRelease();
}

export async function readReleaseForPublish(): Promise<ReleaseReadResult> {
  if (!isBlobConfigured()) {
    throw new HttpError(503, "BLOB_READ_WRITE_TOKEN is not configured");
  }

  const stored = await readBlobRelease();
  if (stored) return stored;

  return { release: await readSeedRelease(), stored: false };
}

export async function writeRelease(
  release: Release,
  expectedEtag?: string,
): Promise<string> {
  const { BlobPreconditionFailedError, put } = await import("@vercel/blob");
  let blob: Awaited<ReturnType<typeof put>>;
  try {
    blob = await put(BLOB_MANIFEST_PATH, JSON.stringify(release, null, 2), {
      access: "public",
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
      contentType: "application/json",
      ...(expectedEtag ? { ifMatch: expectedEtag } : { allowOverwrite: false }),
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) {
      throw new HttpError(409, "Release changed while publishing; retry", {
        cause: error,
      });
    }
    throw error;
  }

  const stored = await readBlobRelease();
  if (
    !stored ||
    getReleasePublishDecision(release, stored.release, true) !== "unchanged"
  ) {
    throw new Error("Release manifest failed read-after-write verification");
  }
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
    allowOverwrite: false,
    cacheControlMaxAge: 31_536_000,
    contentType,
  });
  return { name, size: body.byteLength, url: blob.url };
}

export async function verifyReleaseAsset(
  kind: AssetKind,
  asset: ReleaseAsset,
): Promise<ReleaseAsset> {
  const {
    BlobAccessError,
    BlobNotFoundError,
    BlobPathnameMismatchError,
    BlobStoreNotFoundError,
    head,
  } = await import("@vercel/blob");

  try {
    const metadata = await head(asset.url);
    return validateReleaseAssetMetadata(kind, asset, metadata);
  } catch (error) {
    if (
      error instanceof BlobAccessError ||
      error instanceof BlobNotFoundError ||
      error instanceof BlobPathnameMismatchError ||
      error instanceof BlobStoreNotFoundError
    ) {
      throw new HttpError(422, `${kind} is not in the configured Blob store`, {
        cause: error,
      });
    }
    throw error;
  }
}

export function validateReleaseAssetMetadata(
  kind: AssetKind,
  asset: ReleaseAsset,
  metadata: ReleaseAssetMetadata,
): ReleaseAsset {
  const expectedPath = `release/${asset.name}`;
  if (
    !ASSET_FILE_PATTERNS[kind].test(asset.name) ||
    metadata.pathname !== expectedPath ||
    metadata.url !== asset.url ||
    metadata.size !== asset.size
  ) {
    throw new HttpError(422, `${kind} metadata does not match the uploaded Blob`);
  }

  validateAssetSize(kind, metadata.size);
  return { name: asset.name, size: metadata.size, url: metadata.url };
}

export function validateAssetSize(kind: AssetKind, size: number): void {
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new HttpError(400, "Asset size must be a positive integer");
  }

  const limit = kind === "installer" ? MAX_INSTALLER_BYTES : MAX_UPDATER_BYTES;
  if (size >= limit) {
    throw new HttpError(413, `${kind} must be under ${limit} bytes`);
  }
}

export function validateAssetBody(
  kind: AssetKind,
  body: ArrayBuffer | Uint8Array,
): void {
  const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
  // Installers are executables. Updater payloads are either the signed NSIS
  // executable (Tauri v2) or the legacy zipped installer.
  const signatures =
    kind === "installer"
      ? [[0x4d, 0x5a]]
      : [
          [0x4d, 0x5a],
          [0x50, 0x4b],
        ];
  const matches = signatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte),
  );
  if (!matches) {
    throw new HttpError(422, `Asset contents do not match ${kind} file type`);
  }
}

export function parseAssetFileName(raw: string | null): string {
  if (raw === null || raw.trim() === "") {
    throw new HttpError(400, "x-file-name header is required");
  }

  const base = raw.trim().split(/[\\/]/).pop() ?? "";
  const parsed = SafeFileNameSchema.safeParse(base);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid x-file-name header");
  }
  return parsed.data;
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch (error) {
    throw new HttpError(400, "Invalid JSON body", { cause: error });
  }
}

export function getReleasePublishDecision(
  current: Release,
  candidate: Release,
  hasStoredManifest: boolean,
): "publish" | "unchanged" {
  const order = compare(candidate.version, current.version);
  if (order < 0) {
    throw new HttpError(409, `Cannot replace ${current.version} with older ${candidate.version}`);
  }
  if (order > 0 || !hasStoredManifest) return "publish";
  if (sameReleaseContent(current, candidate)) return "unchanged";
  throw new HttpError(409, `Release ${candidate.version} is already published`);
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
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}

export function logServerError(context: string, error: unknown): void {
  if (!(error instanceof HttpError) || error.status >= 500) {
    console.error(context, error);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readSeedRelease(): Promise<Release> {
  const raw = await readFile(SEED_MANIFEST_PATH, "utf8");
  return parseStoredRelease(JSON.parse(raw) as unknown);
}

async function readBlobRelease(): Promise<ReleaseReadResult | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(BLOB_MANIFEST_PATH, {
    access: "public",
    useCache: false,
  });
  if (!result) return null;
  if (result.statusCode !== 200 || result.stream === null) {
    throw new Error("Release manifest returned without a body");
  }

  const raw: unknown = await new Response(result.stream).json();
  return {
    release: parseStoredRelease(raw),
    etag: result.blob.etag,
    manifestUrl: result.blob.url,
    stored: true,
  };
}

function parseStoredRelease(raw: unknown): Release {
  const parsed = StoredReleaseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Stored release manifest is invalid", { cause: parsed.error });
  }
  return parsed.data;
}

function sameReleaseContent(left: Release, right: Release): boolean {
  return (
    left.version === right.version &&
    left.notes === right.notes &&
    left.installer.name === right.installer.name &&
    left.installer.size === right.installer.size &&
    left.installer.url === right.installer.url &&
    left.updater.name === right.updater.name &&
    left.updater.size === right.updater.size &&
    left.updater.url === right.updater.url &&
    left.updater.signature === right.updater.signature
  );
}

function isTauriSignature(value: string): boolean {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 === 1) {
    return false;
  }

  const normalized = value.replace(/=+$/, "");
  const decodedBytes = Buffer.from(value, "base64");
  if (decodedBytes.toString("base64").replace(/=+$/, "") !== normalized) {
    return false;
  }

  const decoded = decodedBytes.toString("utf8");
  return decoded.startsWith("untrusted comment:") && decoded.includes("\ntrusted comment:");
}
