import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ModelViewer } from "@/components/ModelViewer";
import { bytes, money, type PrintSettings } from "@/lib/format";
import { getPublishedProduct } from "@/lib/products";
import { publicUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/models/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: product.images[0] ? { images: [publicUrl(product.images[0].r2Key)] } : undefined,
  };
}

export default async function ModelPage({ params }: PageProps<"/models/[slug]">) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  const version = product.versions[0];
  const files = version?.files ?? [];
  const preview = files.find((f) => f.previewGlbKey)?.previewGlbKey;
  const settings = (product.printSettings ?? {}) as PrintSettings;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => publicUrl(i.r2Key)),
    offers: { "@type": "Offer", price: (product.priceCents / 100).toFixed(2), priceCurrency: "USD" },
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-3">
        {preview ? (
          <ModelViewer url={publicUrl(preview)} />
        ) : product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicUrl(product.images[0].r2Key)} alt={product.images[0].alt} className="w-full rounded-lg" />
        ) : null}
        <div className="grid grid-cols-4 gap-2">
          {product.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={publicUrl(img.r2Key)} alt={img.alt} className="aspect-square object-cover rounded-md" />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <div className="text-zinc-600 mt-1">{product.priceCents === 0 ? "Free" : money(product.priceCents)}</div>
        </div>

        <AddToCart productId={product.id} priceCents={product.priceCents} commercialPriceCents={product.commercialPriceCents} />

        <p className="whitespace-pre-line text-zinc-700">{product.description}</p>

        <section>
          <h2 className="font-semibold mb-2">Files {version ? `(v${version.version})` : ""}</h2>
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white text-sm">
            {files.map((f) => (
              <li key={f.id} className="flex justify-between px-3 py-2">
                <span>{f.filename}</span>
                <span className="text-zinc-500">
                  {f.format === "THREEMF" ? "3MF" : "STL"} · {bytes(f.sizeBytes)}
                </span>
              </li>
            ))}
            {files.length === 0 && <li className="px-3 py-2 text-zinc-500">Files coming soon</li>}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Print settings</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {settings.technology && (<><dt className="text-zinc-500">Technology</dt><dd>{settings.technology}</dd></>)}
            {settings.printer && (<><dt className="text-zinc-500">Tested on</dt><dd>{settings.printer}</dd></>)}
            {settings.layerHeightMm != null && (<><dt className="text-zinc-500">Layer height</dt><dd>{settings.layerHeightMm} mm</dd></>)}
            {settings.infillPercent != null && (<><dt className="text-zinc-500">Infill</dt><dd>{settings.infillPercent}%</dd></>)}
            {settings.supports != null && (<><dt className="text-zinc-500">Supports</dt><dd>{settings.supports ? "Yes" : "No"}</dd></>)}
            {settings.printTimeHours != null && (<><dt className="text-zinc-500">Print time</dt><dd>{settings.printTimeHours} h</dd></>)}
            {settings.filamentGrams != null && (<><dt className="text-zinc-500">Filament</dt><dd>{settings.filamentGrams} g</dd></>)}
            {settings.bedSizeMm && (<><dt className="text-zinc-500">Bed size needed</dt><dd>{settings.bedSizeMm}</dd></>)}
          </dl>
        </section>

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <a key={t} href={`/models?tag=${encodeURIComponent(t)}`} className="rounded-full border border-zinc-300 px-3 py-1 text-xs">
                {t}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
