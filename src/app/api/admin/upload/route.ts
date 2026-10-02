import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { signedUploadUrl } from "@/lib/r2";

const MAX_BYTES = 500 * 1024 * 1024;

const schema = z.object({
  productId: z.string(),
  filename: z.string().min(1).max(200),
  contentType: z.string(),
  sizeBytes: z.number().int().positive().max(MAX_BYTES),
  kind: z.enum(["model", "image", "preview"]),
});

const allowed: Record<string, RegExp> = {
  model: /\.(stl|3mf)$/i,
  image: /\.(png|jpe?g|webp)$/i,
  preview: /\.glb$/i,
};

/** Returns a presigned PUT so the browser uploads straight to R2. Model files land under a private prefix. */
export async function POST(request: Request) {
  await requireAdmin();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const { productId, filename, contentType, kind } = parsed.data;
  if (!allowed[kind].test(filename)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = kind === "model" ? "models" : "public";
  const key = `${prefix}/${productId}/${crypto.randomUUID()}-${safeName}`;
  const url = await signedUploadUrl(key, contentType);
  return NextResponse.json({ url, key });
}
