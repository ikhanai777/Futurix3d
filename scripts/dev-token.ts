import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { db } from "../src/lib/db";

/** Dev helper: prints a one-time magic-link token for an email, without sending mail. */
async function main() {
  const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const t = randomBytes(32).toString("base64url");
  await db.magicLinkToken.create({
    data: { email, tokenHash: createHash("sha256").update(t).digest("hex"), expiresAt: new Date(Date.now() + 900000) },
  });
  console.log(t);
  await db.$disconnect();
}
main();
