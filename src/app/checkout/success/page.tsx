import Link from "next/link";
import { createSession } from "@/lib/auth";
import { writeCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { grantOrder } from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import { DownloadButton } from "@/components/DownloadButton";

export const dynamic = "force-dynamic";

/**
 * Lands here straight from Stripe. The webhook normally records the order first;
 * if it hasn't arrived yet we record it here from the verified session so the
 * buyer never waits. Both paths are idempotent on the session id.
 */
export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { session_id } = await searchParams;
  if (typeof session_id !== "string") {
    return <p className="text-zinc-500">Missing checkout session.</p>;
  }

  const checkout = await stripe().checkout.sessions.retrieve(session_id);
  const email = checkout.customer_details?.email ?? checkout.customer_email;
  if (checkout.payment_status !== "paid" || !email) {
    return <p className="text-zinc-500">Payment not completed. <Link href="/cart" className="underline">Back to cart</Link>.</p>;
  }

  const lines = JSON.parse(checkout.metadata?.lines ?? "[]") as { p: string; l: "PERSONAL" | "COMMERCIAL"; c: number }[];
  const order = await grantOrder({
    email,
    stripeSessionId: checkout.id,
    stripeCustomerId: typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id,
    items: lines.map((l) => ({ productId: l.p, license: l.l, priceCents: l.c })),
    taxCents: checkout.total_details?.amount_tax ?? 0,
    currency: checkout.currency ?? "usd",
  });

  // The buyer just proved control of this email to Stripe; sign them in so downloads work right away.
  await createSession(email);
  await writeCart([]);

  const items = await db.orderItem.findMany({
    where: { orderId: order.id },
    include: {
      product: {
        include: { versions: { orderBy: { version: "desc" }, take: 1, include: { files: true } } },
      },
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Thanks! Your files are ready.</h1>
        <p className="text-zinc-600 mt-1">A receipt with these links is on its way to {email}. They&apos;re also in your <Link href="/library" className="underline">library</Link>.</p>
      </div>
      {items.map((item) => (
        <section key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">{item.product.title}</h2>
          <ul className="mt-2 space-y-1">
            {item.product.versions[0]?.files.map((f) => (
              <li key={f.id} className="flex items-center justify-between text-sm">
                <span>{f.filename}</span>
                <DownloadButton fileId={f.id} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
