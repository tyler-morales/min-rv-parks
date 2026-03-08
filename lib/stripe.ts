import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

export const isStripeEnabled = Boolean(secret);

export const stripe: Stripe | null = secret
  ? new Stripe(secret, { typescript: true })
  : null;
