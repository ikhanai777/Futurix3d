import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { listPublishedProducts, allTags } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, tags] = await Promise.all([listPublishedProducts(), allTags()]);
  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-white border border-zinc-200 p-8">
        <h1 className="text-3xl font-semibold tracking-tight">Print-ready STL and 3MF files</h1>
        <p className="mt-2 text-zinc-600 max-w-xl">
          Tested models with print settings included. Pay once, download instantly, and keep every file in your library forever.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link key={t} href={`/models?tag=${encodeURIComponent(t)}`} className="rounded-full border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100">
              {t}
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Newest models</h2>
        {products.length === 0 ? (
          <p className="text-zinc-500">No models published yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 12).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
