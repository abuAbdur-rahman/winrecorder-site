import { connection } from "next/server";
import { z } from "zod";

import {
  ReleaseInputSchema,
  errorResponse,
  getReleasePublishDecision,
  logServerError,
  parseJsonBody,
  readRelease,
  readReleaseForPublish,
  requireReleaseToken,
  verifyReleaseAsset,
  writeRelease,
  type Release,
} from "@/lib/release";

/** Current release record, used by the release workflow for a pre-flight read. */
export async function GET() {
  await connection();
  try {
    return Response.json(await readRelease(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/release failed", error);
    return errorResponse(error);
  }
}

/**
 * Publishes a release. Assets are uploaded first through /api/release/asset,
 * then this endpoint receives the finished manifest.
 *
 *   curl -X POST $SITE/api/release -H "authorization: Bearer $RELEASE_TOKEN" \
 *        -H "content-type: application/json" -d @release.json
 */
export async function POST(request: Request) {
  try {
    requireReleaseToken(request);
    const parsed = ReleaseInputSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid release payload", details: z.flattenError(parsed.error) },
        { status: 422 },
      );
    }

    const payload = parsed.data;
    const release: Release = {
      version: payload.version,
      notes: payload.notes,
      pubDate: payload.pubDate ?? new Date().toISOString(),
      installer: payload.installer,
      updater: payload.updater,
    };

    const current = await readReleaseForPublish();
    const decision = getReleasePublishDecision(
      current.release,
      release,
      current.stored,
    );
    if (decision === "unchanged") {
      return Response.json({
        ok: true,
        idempotent: true,
        version: release.version,
        manifestUrl: current.manifestUrl,
      });
    }

    const [installer, updater] = await Promise.all([
      verifyReleaseAsset("installer", release.installer),
      verifyReleaseAsset("updater", release.updater),
    ]);
    const verifiedRelease: Release = {
      ...release,
      installer,
      updater: { ...updater, signature: release.updater.signature },
    };

    const manifestUrl = await writeRelease(verifiedRelease, current.etag);
    return Response.json({ ok: true, version: verifiedRelease.version, manifestUrl });
  } catch (error) {
    logServerError("POST /api/release failed", error);
    return errorResponse(error);
  }
}
