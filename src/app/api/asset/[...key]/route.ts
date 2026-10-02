import { NextResponse } from "next/server";
import { signedReadUrl } from "@/lib/r2";

/** Serves images and preview meshes when the bucket has no public domain. Never model files. */
export async function GET(_request: Request, { params }: RouteContext<"/api/asset/[...key]">) {
  const { key } = await params;
  const joined = key.map(decodeURIComponent).join("/");
  if (!joined.startsWith("public/")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = await signedReadUrl(joined);
  return NextResponse.redirect(url, { headers: { "cache-control": "public, max-age=3000" } });
}
