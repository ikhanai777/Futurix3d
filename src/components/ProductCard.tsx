import Link from "next/link";
import { money } from "@/lib/format";
import { publicUrl } from "@/lib/r2";

export function ProductCard({
  product,
}: {
  product: {
    slug: string;
    title: string;
    priceCents: number;
    tags: string[];
    images: { r2Key: string; alt: string }[];
  };
}) {
  const image = product.images[0];
  return (
    <Link
      href={`/models/${product.slug}`}
      className="group rounded-lg border border-zinc-200 bg-white overflow-hidden hover:shadow-md transition"
    >
      <div className="aspect-square bg-zinc-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicUrl(image.r2Key)} alt={image.alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium group-hover:underline">{product.title}</div>
        <div className="text-sm text-zinc-600 mt-1">
          {product.priceCents === 0 ? "Free" : money(product.priceCents)}
        </div>
      </div>
    </Link>
  );
}
