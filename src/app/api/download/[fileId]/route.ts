import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { entitlementForFile } from "@/lib/entitlements";
import { signedDownloadUrl } from "@/lib/r2";

const DAILY_LIMIT = 30;

/** Checks ownership, logs the download, then redirects to a 10-minute signed R2 link. */
export async function GET(request: Request, { params }: RouteContext<"/api/download/[fileId]">) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, request.url));
  }

  const { fileId } = await params;
  const owned = await entitlementForFile(session.email, fileId);
  if (!owned) return NextResponse.json({ error: "You don't own this file" }, { status: 403 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await db.download.count({
    where: { entitlementId: owned.entitlement.id, createdAt: { gte: since } },
  });
  if (recent >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Daily download limit reached. Try again tomorrow." }, { status: 429 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  await db.download.create({
    data: {
      entitlementId: owned.entitlement.id,
      modelFileId: owned.file.id,
      ipHash: ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null,
    },
  });

  const url = await signedDownloadUrl(owned.file.r2Key, owned.file.filename);
  return NextResponse.redirect(url, { headers: { "cache-control": "no-store" } });
}
