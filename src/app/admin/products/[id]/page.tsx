import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bytes, type PrintSettings } from "@/lib/format";
import { publicUrl } from "@/lib/r2";
import { deleteFile, deleteImage, deleteProduct, newVersion, updateProduct } from "../../actions";
import { ProductForm } from "../ProductForm";
import { FileUploader } from "./FileUploader";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      versions: { orderBy: { version: "desc" }, include: { files: true } },
    },
  });
  if (!product) notFound();
  const current = product.versions[0];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div className="flex items-center gap-3 text-sm">
          {product.status === "PUBLISHED" && <Link href={`/models/${product.slug}`} className="underline">View in store</Link>}
          <form action={deleteProduct.bind(null, product.id)}>
            <button className="text-red-600 hover:underline">Delete</button>
          </form>
        </div>
      </div>

      <ProductForm
        action={updateProduct.bind(null, product.id)}
        values={{ ...product, printSettings: product.printSettings as PrintSettings | null }}
        submitLabel="Save changes"
      />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Model files {current ? `(v${current.version})` : ""}</h2>
          <form action={async (form: FormData) => { "use server"; await newVersion(product.id, String(form.get("changelog") ?? "")); }} className="flex gap-2">
            <input name="changelog" placeholder="What changed?" className="rounded-md border border-zinc-300 px-2 py-1 text-sm" />
            <button className="rounded-md border border-zinc-300 px-3 py-1 text-sm">Start new version</button>
          </form>
        </div>
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white text-sm">
          {current?.files.map((f) => (
            <li key={f.id} className="flex items-center justify-between px-3 py-2">
              <span>
                {f.filename} <span className="text-zinc-400">· {f.format === "THREEMF" ? "3MF" : "STL"} · {bytes(f.sizeBytes)}</span>
                {f.previewGlbKey && <span className="ml-2 text-xs text-green-700">preview attached</span>}
              </span>
              <form action={deleteFile.bind(null, f.id, product.id)}>
                <button className="text-zinc-500 hover:text-red-600">Remove</button>
              </form>
            </li>
          ))}
          {!current?.files.length && <li className="px-3 py-2 text-zinc-500">No files in this version yet</li>}
        </ul>
        <FileUploader productId={product.id} kind="model" accept=".stl,.3mf" label="Upload STL / 3MF files" />
        <FileUploader productId={product.id} kind="preview" accept=".glb" label="Upload preview mesh (.glb, decimated)" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Photos</h2>
        <div className="grid grid-cols-4 gap-3">
          {product.images.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl(img.r2Key)} alt={img.alt} className="aspect-square object-cover rounded-md" />
              <form action={deleteImage.bind(null, img.id, product.id)} className="absolute top-1 right-1">
                <button className="rounded bg-white/90 px-2 py-0.5 text-xs text-red-600">Remove</button>
              </form>
            </div>
          ))}
        </div>
        <FileUploader productId={product.id} kind="image" accept="image/png,image/jpeg,image/webp" label="Upload photos" />
      </section>
    </div>
  );
}
