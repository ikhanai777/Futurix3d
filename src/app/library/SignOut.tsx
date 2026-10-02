import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await clearSession();
        redirect("/");
      }}
    >
      <button className="text-sm text-zinc-500 hover:underline">Sign out</button>
    </form>
  );
}
