import { NextResponse } from "next/server";
import { createSession, verifyMagicLink } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const next = url.searchParams.get("next") ?? "/library";
  const email = await verifyMagicLink(token);
  if (!email) return NextResponse.redirect(new URL("/login?error=expired", request.url));
  await createSession(email);
  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/library", request.url));
}
