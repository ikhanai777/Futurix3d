import { db } from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

function thirtyDaysAgo() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export default async function AdminDashboard() {
  const since30d = thirtyDaysAgo();
  const [revenue, orders, downloads, top] = await Promise.all([
    db.order.aggregate({ _sum: { subtotalCents: true }, where: { status: "PAID", createdAt: { gte: since30d } } }),
    db.order.count({ where: { status: "PAID", createdAt: { gte: since30d } } }),
    db.download.count({ where: { createdAt: { gte: since30d } } }),
    db.orderItem.groupBy({
      by: ["productId"],
      _count: { _all: true },
      _sum: { priceCents: true },
      where: { order: { status: "PAID" } },
      orderBy: { _sum: { priceCents: "desc" } },
      take: 5,
    }),
  ]);
  const products = await db.product.findMany({
    where: { id: { in: top.map((t) => t.productId) } },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Last 30 days</h1>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Revenue" value={money(revenue._sum.subtotalCents ?? 0)} />
        <Stat label="Orders" value={String(orders)} />
        <Stat label="Downloads" value={String(downloads)} />
      </div>
      <section>
        <h2 className="font-semibold mb-2">Top products, all time</h2>
        <table className="w-full text-sm bg-white border border-zinc-200 rounded-lg">
          <thead className="text-left text-zinc-500">
            <tr><th className="p-2">Product</th><th className="p-2">Sales</th><th className="p-2">Revenue</th></tr>
          </thead>
          <tbody>
            {top.map((t) => (
              <tr key={t.productId} className="border-t border-zinc-200">
                <td className="p-2">{products.find((p) => p.id === t.productId)?.title ?? t.productId}</td>
                <td className="p-2">{t._count._all}</td>
                <td className="p-2">{money(t._sum.priceCents ?? 0)}</td>
              </tr>
            ))}
            {top.length === 0 && <tr><td className="p-2 text-zinc-500" colSpan={3}>No sales yet</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
