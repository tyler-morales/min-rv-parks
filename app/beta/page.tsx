import Link from "next/link";
import { Sparkles, Search, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Join Beta — Mini RV Parks",
  description:
    "Mini RV Parks is in private beta. Apply for guest access to request stays and storage from verified hosts.",
};

const BENEFITS = [
  {
    icon: Search,
    text: "Browse and search real RV pads and storage",
  },
  {
    icon: Mail,
    text: "Request to book or store — no account required to browse",
  },
  {
    icon: CheckCircle,
    text: "Pay only after the host accepts (24h to complete payment)",
  },
] as const;

export default function BetaPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 to-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles
            className="mx-auto size-12 text-emerald-600"
            aria-hidden
            strokeWidth={1.5}
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Join the Beta
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Mini RV Parks is in private beta. We&apos;re adding hosts and
            listings and would love to have you as an early guest. Apply below
            and we&apos;ll be in touch.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            >
              <Link href="/apply">Apply for beta access</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20" aria-labelledby="beta-benefits">
        <div className="mx-auto max-w-2xl">
          <h2 id="beta-benefits" className="text-center text-2xl font-bold text-gray-900">
            What beta guests can do
          </h2>
          <ul className="mt-10 space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <Icon
                  className="mt-0.5 size-5 shrink-0 text-emerald-600"
                  aria-hidden
                  strokeWidth={1.5}
                />
                <span className="text-gray-700">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-sm text-gray-500">
            No guest account in beta — you&apos;ll enter your details when you
            submit a request. Beta approval lets you submit requests to book or
            store.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            >
              <Link href="/apply">Apply now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
