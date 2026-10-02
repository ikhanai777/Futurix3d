import { db } from "./db";

/** Products a buyer owns, newest first, with the current version's files. */
export async function libraryFor(email: string) {
  return db.entitlement.findMany({
    where: { customer: { email }, revokedAt: null },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: { files: { orderBy: { filename: "asc" } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Active entitlement for a product, if the buyer has one. */
export async function entitlementForFile(email: string, modelFileId: string) {
  const file = await db.modelFile.findUnique({
    where: { id: modelFileId },
    include: { version: true },
  });
  if (!file) return null;
  const entitlement = await db.entitlement.findFirst({
    where: { customer: { email }, productId: file.version.productId, revokedAt: null },
  });
  return entitlement ? { entitlement, file } : null;
}
