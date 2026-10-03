"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendReceiptEmail } from "@/lib/email";
import { slugify } from "@/lib/format";
import { refundOrder } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

const productSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(80),
  description: z.string().max(10000),
  priceCents: z.coerce.number().int().min(0),
  commercialPriceCents: z.coerce.number().int().min(0).optional().or(z.literal("")),
  tags: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  printer: z.string().optional(),
  technology: z.enum(["FDM", "Resin", ""]).optional(),
  layerHeightMm: z.coerce.number().optional().or(z.literal("")),
  infillPercent: z.coerce.number().optional().or(z.literal("")),
  supports: z.string().optional(),
  printTimeHours: z.coerce.number().optional().or(z.literal("")),
  filamentGrams: z.coerce.number().optional().or(z.literal("")),
  bedSizeMm: z.string().optional(),
});

function num(v: number | "" | undefined) {
  return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
}

function toData(form: FormData) {
  const parsed = productSchema.parse(Object.fromEntries(form));
  return {
    title: parsed.title,
    slug: slugify(parsed.slug || parsed.title),
    description: parsed.description,
    priceCents: parsed.priceCents,
    commercialPriceCents: num(parsed.commercialPriceCents) ?? null,
    tags: parsed.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    status: parsed.status,
    printSettings: {
      printer: parsed.printer || undefined,
      technology: parsed.technology || undefined,
      layerHeightMm: num(parsed.layerHeightMm),
      infillPercent: num(parsed.infillPercent),
      supports: parsed.supports === "on" ? true : parsed.supports === "off" ? false : undefined,
      printTimeHours: num(parsed.printTimeHours),
      filamentGrams: num(parsed.filamentGrams),
      bedSizeMm: parsed.bedSizeMm || undefined,
    },
  };
}

export async function createProduct(form: FormData) {
  await requireAdmin();
  const data = toData(form);
  const product = await db.product.create({
    data: { ...data, versions: { create: { version: 1 } } },
  });
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(id: string, form: FormData) {
  await requireAdmin();
  await db.product.update({ where: { id }, data: toData(form) });
  revalidatePath("/");
  revalidatePath(`/admin/products/${id}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const sold = await db.orderItem.count({ where: { productId: id } });
  if (sold > 0) {
    await db.product.update({ where: { id }, data: { status: "DRAFT" } });
  } else {
    await db.product.delete({ where: { id } });
  }
  redirect("/admin/products");
}

/** Called after the browser has PUT the file straight into R2. */
export async function registerFile(input: {
  productId: string;
  filename: string;
  sizeBytes: number;
  r2Key: string;
  kind: "model" | "image" | "preview";
}) {
  await requireAdmin();
  const product = await db.product.findUniqueOrThrow({
    where: { id: input.productId },
    include: { versions: { orderBy: { version: "desc" }, take: 1, include: { files: true } } },
  });
  const version = product.versions[0] ?? (await db.productVersion.create({ data: { productId: product.id, version: 1 } }));

  if (input.kind === "image") {
    await db.productImage.create({
      data: { productId: product.id, r2Key: input.r2Key, alt: product.title, sortOrder: Date.now() % 100000 },
    });
  } else if (input.kind === "preview") {
    // A preview GLB attaches to the first model file so the viewer can find it.
    const first = version.files[0];
    if (first) await db.modelFile.update({ where: { id: first.id }, data: { previewGlbKey: input.r2Key } });
  } else {
    const lower = input.filename.toLowerCase();
    await db.modelFile.create({
      data: {
        versionId: version.id,
        filename: input.filename,
        format: lower.endsWith(".3mf") ? "THREEMF" : "STL",
        sizeBytes: input.sizeBytes,
        r2Key: input.r2Key,
      },
    });
  }
  revalidatePath(`/admin/products/${product.id}`);
}

export async function deleteFile(fileId: string, productId: string) {
  await requireAdmin();
  await db.modelFile.delete({ where: { id: fileId } });
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteImage(imageId: string, productId: string) {
  await requireAdmin();
  await db.productImage.delete({ where: { id: imageId } });
  revalidatePath(`/admin/products/${productId}`);
}

/** Starts a new version: buyers keep access and see the new files automatically. */
export async function newVersion(productId: string, changelog: string) {
  await requireAdmin();
  const latest = await db.productVersion.findFirst({ where: { productId }, orderBy: { version: "desc" } });
  await db.productVersion.create({
    data: { productId, version: (latest?.version ?? 0) + 1, changelog: changelog || null },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function refund(orderId: string) {
  await requireAdmin();
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!order.stripeSessionId.startsWith("free_")) {
    const session = await stripe().checkout.sessions.retrieve(order.stripeSessionId);
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (paymentIntent) await stripe().refunds.create({ payment_intent: paymentIntent });
  }
  await refundOrder(orderId);
  revalidatePath("/admin/orders");
}

export async function resendReceipt(orderId: string) {
  await requireAdmin();
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { customer: true, items: { include: { product: true } } },
  });
  await sendReceiptEmail(
    order.customer.email,
    order.items.map((i) => ({ title: i.product.title, license: i.license })),
  );
}
