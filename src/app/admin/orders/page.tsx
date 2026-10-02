import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { refund, resendReceipt } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, items: { include: { product: true } } },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <table className="w-full text-sm bg-white border border-zinc-200 rounded-lg">
        <thead className="text-left text-zinc-500">
          <tr><th className="p-2">Date</th><th className="p-2">Customer</th><th className="p-2">Items</th><th className="p-2">Total</th><th className="p-2">Status</th><th className="p-2"></th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-zinc-200 align-top">
              <td className="p-2 whitespace-nowrap">{o.createdAt.toISOString().slice(0, 10)}</td>
              <td className="p-2">{o.customer.email}</td>
              <td className="p-2">
                {o.items.map((i) => (
                  <div key={i.id}>{i.product.title} <span className="text-zinc-400">({i.license.toLowerCase()})</span></div>
                ))}
              </td>
              <td className="p-2">{money(o.totalCents, o.currency.toUpperCase())}</td>
              <td className="p-2">{o.status === "PAID" ? "Paid" : o.status === "REFUNDED" ? "Refunded" : "Pending"}</td>
              <td className="p-2 whitespace-nowrap space-x-3">
                <form action={resendReceipt.bind(null, o.id)} className="inline">
                  <button className="underline">Resend email</button>
                </form>
                {o.status === "PAID" && (
                  <form action={refund.bind(null, o.id)} className="inline">
                    <button className="text-red-600 underline">Refund</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td className="p-2 text-zinc-500" colSpan={6}>No orders yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
