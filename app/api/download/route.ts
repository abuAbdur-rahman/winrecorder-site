import { connection } from "next/server";

import { absoluteUrl, readRelease } from "@/lib/release";

/**
 * Stable download link for the current Windows installer. Always redirects to
 * whichever build the release manifest points at, so the landing page and any
 * shared link keep working across versions.
 */
export async function GET(request: Request) {
  await connection();
  try {
    const release = await readRelease();
    return new Response(null, {
      status: 302,
      headers: {
        location: absoluteUrl(release.installer.url, request.url),
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/download failed", error);
    return Response.json({ error: "No installer available" }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  await connection();
  try {
    const release = await readRelease();
    return new Response(null, {
      status: 302,
      headers: {
        location: absoluteUrl(release.installer.url, request.url),
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("HEAD /api/download failed", error);
    return new Response(null, { status: 500 });
  }
}
