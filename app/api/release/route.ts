import { connection } from "next/server";
import { z } from "zod";

import {
  errorResponse,
  readRelease,
  requireReleaseToken,
  writeRelease,
  type Release,
} from "@/lib/release";

const AssetUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith("https://"), "Asset URL must use HTTPS");

const AssetSchema = z.object({
  name: z.string().min(1).max(200),
  size: z.number().int().positive(),
  url: AssetUrlSchema,
});

const ReleaseSchema = z.object({
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/, "Must be a semver version"),
  notes: z.string().max(2000).default(""),
  pubDate: z.iso.datetime().optional(),
  installer: AssetSchema,
  updater: AssetSchema.extend({
    signature: z.string().min(1).max(4000),
  }),
});

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
    const parsed = ReleaseSchema.safeParse(await request.json());
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

    const manifestUrl = await writeRelease(release);
    return Response.json({ ok: true, version: release.version, manifestUrl });
  } catch (error) {
    console.error("POST /api/release failed", error);
    return errorResponse(error);
  }
}
