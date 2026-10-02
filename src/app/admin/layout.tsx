import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/login?next=/admin");
  return (
    <div className="grid md:grid-cols-[180px_1fr] gap-8">
      <nav className="space-y-1 text-sm">
        <div className="font-semibold mb-2">Admin</div>
        <Link href="/admin" className="block rounded px-2 py-1 hover:bg-zinc-200">Dashboard</Link>
        <Link href="/admin/products" className="block rounded px-2 py-1 hover:bg-zinc-200">Products</Link>
        <Link href="/admin/orders" className="block rounded px-2 py-1 hover:bg-zinc-200">Orders</Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
