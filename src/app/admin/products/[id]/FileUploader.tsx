"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerFile } from "../../actions";

/** Drag-and-drop uploader: asks the API for a presigned URL, PUTs straight to R2, then registers the file. */
export function FileUploader({
  productId,
  kind,
  accept,
  label,
}: {
  productId: string;
  kind: "model" | "image" | "preview";
  accept: string;
  label: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      setStatus(`Uploading ${file.name}…`);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          kind,
        }),
      });
      if (!res.ok) {
        setStatus(`Could not upload ${file.name}: ${(await res.json()).error ?? res.statusText}`);
        return;
      }
      const { url, key } = (await res.json()) as { url: string; key: string };
      const put = await fetch(url, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) {
        setStatus(`Storage rejected ${file.name} (${put.status})`);
        return;
      }
      await registerFile({ productId, filename: file.name, sizeBytes: file.size, r2Key: key, kind });
    }
    setStatus("Done");
    router.refresh();
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files); }}
      className={`rounded-lg border-2 border-dashed p-4 text-sm ${dragging ? "border-zinc-900 bg-zinc-100" : "border-zinc-300"}`}
    >
      <label className="cursor-pointer">
        <span className="underline">{label}</span> or drop them here
        <input type="file" multiple accept={accept} className="hidden" onChange={(e) => e.target.files && void upload(e.target.files)} />
      </label>
      {status && <div className="mt-2 text-zinc-500">{status}</div>}
    </div>
  );
}
