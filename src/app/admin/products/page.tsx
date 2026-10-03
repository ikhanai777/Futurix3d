import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await db.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { orderItems: true } } },
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded-md bg-zinc-900 text-white px-4 py-2 text-sm">New product</Link>
      </div>
      <table className="w-full text-sm bg-white border border-zinc-200 rounded-lg">
        <thead className="text-left text-zinc-500">
          <tr><th className="p-2">Title</th><th className="p-2">Status</th><th className="p-2">Price</th><th className="p-2">Sales</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-zinc-200">
              <td className="p-2"><Link href={`/admin/products/${p.id}`} className="hover:underline">{p.title}</Link></td>
              <td className="p-2">{p.status === "PUBLISHED" ? "Published" : "Draft"}</td>
              <td className="p-2">{money(p.priceCents)}</td>
              <td className="p-2">{p._count.orderItems}</td>
            </tr>
          ))}
          {products.length === 0 && <tr><td className="p-2 text-zinc-500" colSpan={4}>No products yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
