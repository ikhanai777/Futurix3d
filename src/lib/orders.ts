import type { License } from "@/generated/prisma/client";
import { db } from "./db";
import { sendReceiptEmail } from "./email";

export type GrantInput = {
  email: string;
  stripeSessionId: string;
  stripeCustomerId?: string | null;
  items: { productId: string; license: License; priceCents: number }[];
  taxCents: number;
  currency: string;
};

/** Records a paid order and grants one entitlement per product. Idempotent on stripeSessionId. */
export async function grantOrder(input: GrantInput) {
  const email = input.email.toLowerCase();
  const existing = await db.order.findUnique({ where: { stripeSessionId: input.stripeSessionId } });
  if (existing) return existing;

  const subtotal = input.items.reduce((s, i) => s + i.priceCents, 0);

  const order = await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email },
      create: { email, stripeCustomerId: input.stripeCustomerId ?? undefined },
      update: input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {},
    });
    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        stripeSessionId: input.stripeSessionId,
        subtotalCents: subtotal,
        taxCents: input.taxCents,
        totalCents: subtotal + input.taxCents,
        currency: input.currency,
        status: "PAID",
        items: { create: input.items },
      },
    });
    for (const item of input.items) {
      await tx.entitlement.create({
        data: {
          customerId: customer.id,
          productId: item.productId,
          license: item.license,
          source: "ORDER",
          orderId: order.id,
        },
      });
    }
    return order;
  });

  const products = await db.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
    select: { id: true, title: true },
  });
  await sendReceiptEmail(
    email,
    input.items.map((i) => ({
      title: products.find((p) => p.id === i.productId)?.title ?? "Model",
      license: i.license,
    })),
  );
  return order;
}

/** Marks an order refunded and revokes the entitlements it granted. */
export async function refundOrder(orderId: string) {
  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } }),
    db.entitlement.updateMany({ where: { orderId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}
