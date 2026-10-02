import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { env } from "./env";
import { sendMagicLinkEmail } from "./email";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;

export type Session = { email: string; isAdmin: boolean };

function secret() {
  return new TextEncoder().encode(env.authSecret);
}

export async function createSession(email: string) {
  const normalized = email.toLowerCase();
  const token = await new SignJWT({ email: normalized })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const email = String(payload.email);
    return { email, isAdmin: email === env.adminEmail };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("Admin only");
  return session;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Emails a one-time sign-in link valid for 15 minutes. */
export async function sendMagicLink(email: string, next = "/library") {
  const normalized = email.toLowerCase().trim();
  const token = randomBytes(32).toString("base64url");
  await db.magicLinkToken.create({
    data: {
      email: normalized,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  const url = new URL("/auth/verify", env.appUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("next", next);
  await sendMagicLinkEmail(normalized, url.toString());
}

/** Consumes a magic-link token; returns the email on success. */
export async function verifyMagicLink(token: string): Promise<string | null> {
  const record = await db.magicLinkToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  await db.magicLinkToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.email;
}
