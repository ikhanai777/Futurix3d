import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/** Optimistic admin gate. Every admin page and action re-checks with requireAdmin(). */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const loginUrl = new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url);
  if (!token) return NextResponse.redirect(loginUrl);
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    if (String(payload.email) !== process.env.ADMIN_EMAIL?.toLowerCase()) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
