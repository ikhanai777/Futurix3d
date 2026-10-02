import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | undefined;

export function stripe(): Stripe {
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}
