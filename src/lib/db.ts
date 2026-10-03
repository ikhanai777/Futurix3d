import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@/generated/prisma/client";

function create() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Cloudflare Workers can't reuse a database socket across requests, so on Workers
// each request gets its own client. Under plain Node (next dev, scripts) one client is shared.
const perRequest = new WeakMap<object, PrismaClient>();
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  let ctx: object | undefined;
  try {
    ctx = getCloudflareContext().ctx as object;
  } catch {
    ctx = undefined;
  }
  if (ctx) {
    let c = perRequest.get(ctx);
    if (!c) {
      c = create();
      perRequest.set(ctx, c);
    }
    return c;
  }
  globalForPrisma.prisma ??= create();
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client();
    const value = Reflect.get(c, prop);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
