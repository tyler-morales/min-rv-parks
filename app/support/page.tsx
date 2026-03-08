import Link from "next/link";
import { HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Support — Mini RV Parks",
  description:
    "FAQ and contact for Mini RV Parks. Get help with booking, hosting, and the beta.",
};

const FAQ = [
  {
    q: "Do I need an account to search?",
    a: "No. You can browse stays and storage without signing up. You’ll need to be beta-approved to submit a request to book or store.",
  },
  {
    q: "How does request-to-book work?",
    a: "You submit a request with your dates (and message). The host reviews and accepts or declines. If they accept, you have 24 hours to pay via Stripe Checkout. If you don’t pay in time, the request expires and the dates reopen.",
  },
  {
    q: "What’s the difference between Stays and Storage?",
    a: "Stays are nightly RV pads with hookups. Storage is monthly RV storage — you pay a deposit plus first month at checkout. We don’t do recurring billing in beta; renewals will come later.",
  },
  {
    q: "I’m a host. When do I get paid?",
    a: "Payment is collected when the guest completes checkout after you accept. Mini RV Parks handles the payment flow; payouts to hosts are managed separately (see your dashboard or our host docs as we add them).",
  },
  {
    q: "How do I become a host?",
    a: "Go to Host Your Space and log in (or sign up). Create a listing with at least 5 photos, set your price and availability, and submit. Listings are reviewed before they go live.",
  },
  {
    q: "What does “Verified” mean on a listing?",
    a: "In beta, Verified means we’ve checked the location and photos. It’s a quality signal, not a guarantee of amenities — always read the listing details.",
  },
] as const;

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 to-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <HelpCircle
            className="mx-auto size-12 text-emerald-600"
            aria-hidden
            strokeWidth={1.5}
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Support
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            FAQ and contact. We’re a small team in beta — we read every
            message.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-2xl font-bold text-gray-900">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6">
            {FAQ.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-5"
              >
                <dt className="font-semibold text-gray-900">{q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-gray-600">
                  {a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Mail
            className="mx-auto size-10 text-emerald-600"
            aria-hidden
            strokeWidth={1.5}
          />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Still need help?
          </h2>
          <p className="mt-2 text-gray-600">
            For bugs, billing, or anything else, email us. We’ll get back to you
            as soon as we can.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            >
              <a href="mailto:support@minirvparks.com">
                support@minirvparks.com
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
          <p className="mt-8 text-xs text-gray-500">
            You can also read our{" "}
            <Link
              href="/about"
              className="font-medium text-emerald-700 underline hover:text-emerald-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              About
            </Link>{" "}
            and{" "}
            <Link
              href="/beta"
              className="font-medium text-emerald-700 underline hover:text-emerald-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Join Beta
            </Link>{" "}
            pages for more context.
          </p>
        </div>
      </section>
    </div>
  );
}
