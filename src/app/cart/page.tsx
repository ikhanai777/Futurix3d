import Link from "next/link";
import { readCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { RemoveFromCart } from "./RemoveFromCart";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const lines = await readCart();
  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, status: "PUBLISHED" },
  });
  const rows = lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return [];
    const price = line.license === "COMMERCIAL" ? product.commercialPriceCents ?? product.priceCents : product.priceCents;
    return [{ line, product, price }];
  });
  const subtotal = rows.reduce((sum, r) => sum + r.price, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Cart</h1>
      {rows.length === 0 ? (
        <p className="text-zinc-500">
          Your cart is empty. <Link href="/models" className="underline">Browse models</Link>.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {rows.map(({ line, product, price }) => (
              <li key={product.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <Link href={`/models/${product.slug}`} className="font-medium hover:underline">{product.title}</Link>
                  <div className="text-sm text-zinc-500">{line.license === "COMMERCIAL" ? "Commercial" : "Personal"} license</div>
                </div>
                <div>{price === 0 ? "Free" : money(price)}</div>
                <RemoveFromCart productId={product.id} />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <div className="text-zinc-600">Subtotal <span className="font-medium text-zinc-900">{money(subtotal)}</span>. Tax is calculated at checkout.</div>
            <form action="/api/checkout" method="post">
              <button className="rounded-md bg-zinc-900 text-white px-5 py-2.5 font-medium hover:bg-zinc-700">
                {subtotal === 0 ? "Get files" : "Checkout"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
