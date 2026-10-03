import { notFound } from "next/navigation";

const pages: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of sale",
    body: [
      "All products are digital files delivered by download. Nothing physical is shipped.",
      "Because files are delivered immediately, purchases are non-refundable once a file has been downloaded, except where a file is faulty. Refunds revoke access to the files.",
      "By completing checkout you consent to immediate delivery and acknowledge that you lose any statutory right of withdrawal once delivery begins.",
      "Files are licensed, not sold. See the Licenses page for what each license allows.",
    ],
  },
  licenses: {
    title: "Licenses",
    body: [
      "Personal license: print the model as many times as you like for yourself, your family and friends, and gifts. You may not sell prints, share the files, or upload them anywhere.",
      "Commercial license: everything in the personal license, plus the right to sell physical prints of the model. You still may not sell, share, or redistribute the digital files themselves, or sell remixes.",
      "Each download is stamped with your order id so leaked files can be traced.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "We store your email address, your orders and your download history so we can deliver your files and keep them in your library.",
      "Payments are processed by Stripe; we never see your card details.",
      "We do not sell your data. Email us to have your account deleted.",
    ],
  },
};

export default async function LegalPage({ params }: PageProps<"/legal/[page]">) {
  const { page } = await params;
  const content = pages[page];
  if (!content) notFound();
  return (
    <article className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">{content.title}</h1>
      {content.body.map((p) => (
        <p key={p} className="text-zinc-700">{p}</p>
      ))}
      <p className="text-sm text-zinc-500">Placeholder text. Replace with terms reviewed for your jurisdiction before launch.</p>
    </article>
  );
}
