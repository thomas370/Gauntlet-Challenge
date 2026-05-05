// GET /api/steam/cover/[appid]
//
// Same-origin proxy for Steam library art. Two reasons to proxy instead of
// hotlinking the Steam CDN directly:
//   1. Browsers (Firefox strict mode, uBlock, etc.) sometimes block requests
//      to cdn.cloudflare.steamstatic because Cloudflare-fronted CDNs land on
//      tracker lists.
//   2. Lets us pick the right asset (library_600x900 portrait) and fall back
//      to header.jpg when the portrait variant doesn't exist.

import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";

// Try the portrait poster first (matches our local cover aspect ratio). Older
// or indie titles may not have library_600x900 published — fall back to the
// landscape header.jpg which Steam guarantees for every store page.
const ASSET_PRIORITY = ["library_600x900.jpg", "header.jpg"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { appid: string } },
) {
  if (!/^\d+$/.test(params.appid)) {
    return new Response("Invalid appid", { status: 400 });
  }

  for (const asset of ASSET_PRIORITY) {
    const upstream = await fetch(`${STEAM_CDN}/${params.appid}/${asset}`, {
      cache: "no-store",
    });
    if (upstream.ok && upstream.body) {
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
          // 1 day in browser, 7 days on CDN — Steam art rarely changes.
          "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }

  return new Response("Cover not available", { status: 404 });
}
