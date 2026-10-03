import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";
import { readCart } from "@/lib/cart";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Printables Store", template: "%s · Printables Store" },
  description: "3D printable STL and 3MF files, downloaded instantly after purchase.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session, cart] = await Promise.all([getSession(), readCart()]);
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <Header email={session?.email ?? null} isAdmin={session?.isAdmin ?? false} cartCount={cart.length} />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500">
          <Link href="/legal/terms" className="hover:underline">Terms</Link> ·{" "}
          <Link href="/legal/licenses" className="hover:underline">Licenses</Link> ·{" "}
          <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
        </footer>
      </body>
    </html>
  );
}
