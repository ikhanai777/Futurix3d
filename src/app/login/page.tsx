import { sendMagicLink } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, sent, reason } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : "/library";

  async function submit(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const target = String(formData.get("next") ?? "/library");
    if (email.includes("@")) await sendMagicLink(email, target);
    const { redirect } = await import("next/navigation");
    redirect(`/login?sent=1&next=${encodeURIComponent(target)}`);
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {reason === "free" && <p className="text-sm text-zinc-600">Free downloads need an email so we can keep them in your library.</p>}
      {sent ? (
        <p className="text-zinc-700">Check your email for a sign-in link. It works once and expires in 15 minutes.</p>
      ) : (
        <form action={submit} className="space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <button className="w-full rounded-md bg-zinc-900 text-white py-2.5 font-medium hover:bg-zinc-700">
            Email me a sign-in link
          </button>
          <p className="text-xs text-zinc-500">No password. Use the email you bought with to see your purchases.</p>
        </form>
      )}
    </div>
  );
}
