import { Resend } from "resend";
import { env } from "./env";

async function send(to: string, subject: string, html: string) {
  if (!env.resendApiKey) {
    // Local development without an email provider: print the message instead.
    console.log(`[email to ${to}] ${subject}\n${html}`);
    return;
  }
  const resend = new Resend(env.resendApiKey);
  await resend.emails.send({ from: env.emailFrom, to, subject, html });
}

export async function sendMagicLinkEmail(to: string, url: string) {
  await send(
    to,
    "Your sign-in link",
    `<p>Click to sign in and open your library. This link works once and expires in 15 minutes.</p>
     <p><a href="${url}">${url}</a></p>`,
  );
}

export async function sendReceiptEmail(
  to: string,
  items: { title: string; license: string }[],
) {
  const list = items.map((i) => `<li>${i.title} (${i.license.toLowerCase()} license)</li>`).join("");
  const library = new URL("/library", env.appUrl).toString();
  await send(
    to,
    "Your 3D model files are ready",
    `<p>Thanks for your purchase. Your files are in your library, where you can download them any time:</p>
     <ul>${list}</ul>
     <p><a href="${library}">${library}</a></p>
     <p>Sign in with this email address to open it.</p>`,
  );
}
