"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RemoveFromCart({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/cart", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          router.refresh();
        })
      }
      className="text-sm text-zinc-500 hover:text-red-600"
    >
      Remove
    </button>
  );
}
