import {
  errorResponse,
  requireReleaseToken,
  writeAsset,
} from "@/lib/release";

const MAX_ASSET_BYTES = 4 * 1024 * 1024;
const KINDS = ["installer", "updater", "signature"] as const;
type Kind = (typeof KINDS)[number];
const FILE_PATTERNS = {
  installer: /\.exe$/i,
  updater: /\.nsis\.zip$/i,
  signature: /\.sig$/i,
} satisfies Record<Kind, RegExp>;

/**
 * Uploads a single release asset (one request per file, keeping each body
 * under the serverless limit).
 *
 *   curl -X POST "$SITE/api/release/asset?kind=installer" \
 *        -H "authorization: Bearer $RELEASE_TOKEN" \
 *        -H "x-file-name: WinRecorder_x64-setup.exe" \
 *        --data-binary @WinRecorder_x64-setup.exe
 */
export async function POST(request: Request) {
  try {
    requireReleaseToken(request);

    const kind = new URL(request.url).searchParams.get("kind") as Kind | null;
    if (!kind || !KINDS.includes(kind)) {
      return Response.json(
        { error: `kind must be one of: ${KINDS.join(", ")}` },
        { status: 400 },
      );
    }

    const fileName = sanitizeFileName(request.headers.get("x-file-name") ?? "");
    if (!fileName) {
      return Response.json({ error: "x-file-name header is required" }, { status: 400 });
    }
    if (!FILE_PATTERNS[kind].test(fileName)) {
      return Response.json(
        { error: `Invalid file name for ${kind}` },
        { status: 400 },
      );
    }

    const contentLength = request.headers.get("content-length");
    const declaredLength = Number(contentLength ?? "0");
    if (
      contentLength !== null &&
      (!Number.isSafeInteger(declaredLength) || declaredLength < 0)
    ) {
      return Response.json({ error: "Invalid content-length header" }, { status: 400 });
    }
    if (declaredLength > MAX_ASSET_BYTES) {
      return Response.json(
        { error: `Asset exceeds ${MAX_ASSET_BYTES} bytes; publish it from a smaller build` },
        { status: 413 },
      );
    }

    const body = await request.arrayBuffer();
    if (body.byteLength === 0) {
      return Response.json({ error: "Empty body" }, { status: 400 });
    }
    if (body.byteLength > MAX_ASSET_BYTES) {
      return Response.json({ error: "Asset too large" }, { status: 413 });
    }

    const contentType =
      kind === "signature"
        ? "text/plain; charset=utf-8"
        : "application/octet-stream";

    const asset = await writeAsset(fileName, contentType, body);
    return Response.json({ ok: true, kind, ...asset });
  } catch (error) {
    console.error("POST /api/release/asset failed", error);
    return errorResponse(error);
  }
}

function sanitizeFileName(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const base = value.split(/[\\/]/).pop() ?? "";
  if (
    base.length > 180 ||
    !/^[A-Za-z0-9._-]+$/.test(base) ||
    base.startsWith(".")
  ) {
    return null;
  }
  return base;
}
