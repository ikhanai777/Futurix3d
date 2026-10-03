"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";

export function AddToCart({
  productId,
  priceCents,
  commercialPriceCents,
}: {
  productId: string;
  priceCents: number;
  commercialPriceCents: number | null;
}) {
  const [license, setLicense] = useState<"PERSONAL" | "COMMERCIAL">("PERSONAL");
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const add = () =>
    start(async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, license }),
      });
      if (res.ok) {
        setAdded(true);
        router.refresh();
      }
    });

  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <label className="flex items-center gap-2 rounded-md border border-zinc-300 p-3 cursor-pointer has-[:checked]:border-zinc-900">
          <input type="radio" name="license" checked={license === "PERSONAL"} onChange={() => setLicense("PERSONAL")} />
          <span className="flex-1">Personal license</span>
          <span className="font-medium">{priceCents === 0 ? "Free" : money(priceCents)}</span>
        </label>
        {commercialPriceCents != null && (
          <label className="flex items-center gap-2 rounded-md border border-zinc-300 p-3 cursor-pointer has-[:checked]:border-zinc-900">
            <input type="radio" name="license" checked={license === "COMMERCIAL"} onChange={() => setLicense("COMMERCIAL")} />
            <span className="flex-1">Commercial license</span>
            <span className="font-medium">{money(commercialPriceCents)}</span>
          </label>
        )}
      </fieldset>
      <button
        onClick={add}
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 text-white py-2.5 font-medium hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : added ? "Added — add again" : "Add to cart"}
      </button>
      {added && (
        <a href="/cart" className="block text-center text-sm underline">
          Go to cart
        </a>
      )}
    </div>
  );
}
