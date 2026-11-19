import { connection } from "next/server";

import { readRelease, toManifest } from "@/lib/release";

/**
 * Tauri updater endpoint. The app polls this to learn about new builds.
 * Shape: https://v2.tauri.app/plugin/updater/#static-json-file
 */
export async function GET(request: Request) {
  await connection();
  try {
    const release = await readRelease();
    return Response.json(toManifest(release, request.url), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/latest failed", error);
    return Response.json({ error: "No release available" }, { status: 500 });
  }
}
