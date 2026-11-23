import {
  ASSET_KINDS,
  errorResponse,
  logServerError,
  parseAssetFileName,
  requireReleaseToken,
  validateAssetBody,
  validateAssetSize,
  writeAsset,
  type AssetKind,
} from "@/lib/release";

const FILE_PATTERNS = {
  installer: /\.exe$/i,
  updater: /\.(?:exe|nsis\.zip)$/i,
} satisfies Record<AssetKind, RegExp>;

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

    const rawKind = new URL(request.url).searchParams.get("kind");
    if (!rawKind || !ASSET_KINDS.includes(rawKind as AssetKind)) {
      return Response.json(
        { error: `kind must be one of: ${ASSET_KINDS.join(", ")}` },
        { status: 400 },
      );
    }
    const kind = rawKind as AssetKind;

    const fileName = parseAssetFileName(request.headers.get("x-file-name"));
    if (!FILE_PATTERNS[kind].test(fileName)) {
      return Response.json(
        { error: `Invalid file name for ${kind}` },
        { status: 400 },
      );
    }

    const contentLength = request.headers.get("content-length");
    const declaredLength = Number(contentLength ?? "0");
    if (contentLength !== null) {
      validateAssetSize(kind, declaredLength);
    }

    const body = await request.arrayBuffer();
    validateAssetSize(kind, body.byteLength);
    validateAssetBody(kind, body);

    const asset = await writeAsset(fileName, "application/octet-stream", body);
    return Response.json({ ok: true, kind, ...asset });
  } catch (error) {
    logServerError("POST /api/release/asset failed", error);
    return errorResponse(error);
  }
}
