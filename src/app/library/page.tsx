import Link from "next/link";
import { redirect } from "next/navigation";
import { DownloadButton } from "@/components/DownloadButton";
import { getSession } from "@/lib/auth";
import { libraryFor } from "@/lib/entitlements";
import { bytes } from "@/lib/format";
import { publicUrl } from "@/lib/r2";
import { SignOut } from "./SignOut";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/library");
  const entitlements = await libraryFor(session.email);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your library</h1>
          <p className="text-sm text-zinc-500">{session.email}</p>
        </div>
        <SignOut />
      </div>
      {entitlements.length === 0 ? (
        <p className="text-zinc-500">
          Nothing here yet. <Link href="/models" className="underline">Browse models</Link>.
        </p>
      ) : (
        <ul className="space-y-4">
          {entitlements.map((e) => {
            const version = e.product.versions[0];
            const image = e.product.images[0];
            return (
              <li key={e.id} className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4">
                <div className="w-24 h-24 rounded-md bg-zinc-100 overflow-hidden shrink-0">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicUrl(image.r2Key)} alt={image.alt} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/models/${e.product.slug}`} className="font-medium hover:underline">{e.product.title}</Link>
                    <span className="text-xs text-zinc-500">{e.license === "COMMERCIAL" ? "Commercial" : "Personal"} license{version ? ` · v${version.version}` : ""}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {version?.files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between text-sm">
                        <span>{f.filename} <span className="text-zinc-400">· {bytes(f.sizeBytes)}</span></span>
                        <DownloadButton fileId={f.id} />
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
