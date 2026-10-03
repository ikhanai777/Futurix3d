import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { readCart, writeCart } from "@/lib/cart";

const lineSchema = z.object({
  productId: z.string(),
  license: z.enum(["PERSONAL", "COMMERCIAL"]),
});

export async function POST(request: Request) {
  const parsed = lineSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid line" }, { status: 400 });

  const product = await db.product.findFirst({
    where: { id: parsed.data.productId, status: "PUBLISHED" },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.license === "COMMERCIAL" && product.commercialPriceCents == null) {
    return NextResponse.json({ error: "No commercial license" }, { status: 400 });
  }

  const cart = (await readCart()).filter((l) => l.productId !== parsed.data.productId);
  cart.push(parsed.data);
  await writeCart(cart);
  return NextResponse.json({ count: cart.length });
}

export async function DELETE(request: Request) {
  const { productId } = (await request.json()) as { productId?: string };
  const cart = (await readCart()).filter((l) => l.productId !== productId);
  await writeCart(cart);
  return NextResponse.json({ count: cart.length });
}
