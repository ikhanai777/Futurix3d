import Link from "next/link";

export function Header({
  email,
  isAdmin,
  cartCount,
}: {
  email: string | null;
  isAdmin: boolean;
  cartCount: number;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Printables
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          <Link href="/models" className="hover:text-zinc-900">Models</Link>
          {isAdmin && <Link href="/admin" className="hover:text-zinc-900">Admin</Link>}
        </nav>
        <form action="/models" className="ml-auto hidden sm:block">
          <input
            name="q"
            placeholder="Search models"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm w-56"
          />
        </form>
        <Link href="/cart" className="text-sm hover:underline">
          Cart{cartCount > 0 ? ` (${cartCount})` : ""}
        </Link>
        {email ? (
          <Link href="/library" className="text-sm hover:underline">Library</Link>
        ) : (
          <Link href="/login" className="text-sm hover:underline">Sign in</Link>
        )}
      </div>
    </header>
  );
}
