export function DownloadButton({ fileId }: { fileId: string }) {
  return (
    <a
      href={`/api/download/${fileId}`}
      className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
    >
      Download
    </a>
  );
}
