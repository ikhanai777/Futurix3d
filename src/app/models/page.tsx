import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { listPublishedProducts, allTags } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ModelsPage({ searchParams }: PageProps<"/models">) {
  const { q, tag } = await searchParams;
  const query = typeof q === "string" ? q : undefined;
  const activeTag = typeof tag === "string" ? tag : undefined;
  const [products, tags] = await Promise.all([listPublishedProducts(query, activeTag), allTags()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {query ? `Results for “${query}”` : activeTag ? `Tag: ${activeTag}` : "All models"}
        </h1>
        <span className="text-sm text-zinc-500">{products.length} models</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/models" className={`rounded-full border px-3 py-1 text-sm ${!activeTag ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300"}`}>
          All
        </Link>
        {tags.map((t) => (
          <Link
            key={t}
            href={`/models?tag=${encodeURIComponent(t)}`}
            className={`rounded-full border px-3 py-1 text-sm ${activeTag === t ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300"}`}
          >
            {t}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
