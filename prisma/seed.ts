import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Two sample products so the store isn't empty on first run. Files point at keys you upload yourself. */
async function main() {
  await db.product.upsert({
    where: { slug: "dragon-planter" },
    update: {},
    create: {
      slug: "dragon-planter",
      title: "Dragon Planter",
      description: "A coiled dragon wrapped around a 90 mm planter. Prints in two parts with no supports.\n\nIncludes a drainage insert.",
      status: "PUBLISHED",
      priceCents: 599,
      commercialPriceCents: 2499,
      tags: ["home", "planters", "fantasy"],
      printSettings: { technology: "FDM", printer: "Bambu Lab P1S", layerHeightMm: 0.2, infillPercent: 15, supports: false, printTimeHours: 6.5, filamentGrams: 120, bedSizeMm: "120 x 120" },
      versions: { create: { version: 1, changelog: "Initial release" } },
    },
  });
  await db.product.upsert({
    where: { slug: "cable-clip-set" },
    update: {},
    create: {
      slug: "cable-clip-set",
      title: "Cable Clip Set",
      description: "Six snap-fit clips for desk cable management, from 3 mm to 12 mm cables.",
      status: "PUBLISHED",
      priceCents: 0,
      tags: ["tools", "desk"],
      printSettings: { technology: "FDM", layerHeightMm: 0.2, supports: false, printTimeHours: 0.5, filamentGrams: 8 },
      versions: { create: { version: 1 } },
    },
  });
}

main().finally(() => db.$disconnect());
