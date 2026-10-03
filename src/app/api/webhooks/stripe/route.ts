import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { grantOrder, refundOrder } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  // Stripe retries deliveries; process each event id once.
  const seen = await db.processedStripeEvent.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "paid") break;
      const email = session.customer_details?.email ?? session.customer_email;
      if (!email) break;
      const lines = JSON.parse(session.metadata?.lines ?? "[]") as { p: string; l: "PERSONAL" | "COMMERCIAL"; c: number }[];
      await grantOrder({
        email,
        stripeSessionId: session.id,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        items: lines.map((l) => ({ productId: l.p, license: l.l, priceCents: l.c })),
        taxCents: session.total_details?.amount_tax ?? 0,
        currency: session.currency ?? "usd",
      });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (!paymentIntent) break;
      const sessions = await stripe().checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
      const sessionId = sessions.data[0]?.id;
      if (!sessionId) break;
      const order = await db.order.findUnique({ where: { stripeSessionId: sessionId } });
      if (order && order.status !== "REFUNDED") await refundOrder(order.id);
      break;
    }
  }

  await db.processedStripeEvent.create({ data: { id: event.id } });
  return NextResponse.json({ received: true });
}
