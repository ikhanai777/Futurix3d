import { db } from "./db";

export const productWithFiles = {
  images: { orderBy: { sortOrder: "asc" as const } },
  versions: {
    orderBy: { version: "desc" as const },
    take: 1,
    include: { files: { orderBy: { filename: "asc" as const } } },
  },
};

export async function listPublishedProducts(query?: string, tag?: string) {
  return db.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(tag ? { tags: { has: tag } } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { tags: { has: query.toLowerCase() } },
            ],
          }
        : {}),
    },
    include: productWithFiles,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: productWithFiles,
  });
}

export async function allTags(): Promise<string[]> {
  const products = await db.product.findMany({
    where: { status: "PUBLISHED" },
    select: { tags: true },
  });
  return [...new Set(products.flatMap((p) => p.tags))].sort();
}
