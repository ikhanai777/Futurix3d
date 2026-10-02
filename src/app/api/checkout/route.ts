import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readCart, writeCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { grantOrder } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

/** Creates a Stripe Checkout session for the cart. Free carts skip Stripe when the buyer is signed in. */
export async function POST() {
  const lines = await readCart();
  if (lines.length === 0) return NextResponse.redirect(new URL("/cart", env.appUrl), 303);

  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, status: "PUBLISHED" },
  });
  const items = lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return [];
    const priceCents =
      line.license === "COMMERCIAL" ? product.commercialPriceCents ?? product.priceCents : product.priceCents;
    return [{ product, license: line.license, priceCents }];
  });
  if (items.length === 0) return NextResponse.redirect(new URL("/cart", env.appUrl), 303);

  const total = items.reduce((s, i) => s + i.priceCents, 0);
  const session = await getSession();

  if (total === 0) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?next=/cart&reason=free", env.appUrl), 303);
    }
    await grantOrder({
      email: session.email,
      stripeSessionId: `free_${crypto.randomUUID()}`,
      items: items.map((i) => ({ productId: i.product.id, license: i.license, priceCents: 0 })),
      taxCents: 0,
      currency: "usd",
    });
    await writeCart([]);
    return NextResponse.redirect(new URL("/library", env.appUrl), 303);
  }

  const checkout = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: session?.email,
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    line_items: items.map((i) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: i.priceCents,
        tax_behavior: "exclusive",
        product_data: {
          name: `${i.product.title} (${i.license === "COMMERCIAL" ? "commercial" : "personal"} license)`,
          metadata: { productId: i.product.id, license: i.license },
        },
      },
    })),
    metadata: {
      lines: JSON.stringify(items.map((i) => ({ p: i.product.id, l: i.license, c: i.priceCents }))),
    },
    consent_collection: { terms_of_service: "required" },
    success_url: `${env.appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/cart`,
  });

  return NextResponse.redirect(checkout.url!, 303);
}
