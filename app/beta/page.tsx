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
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles
            className="mx-auto size-12 text-primary"
            aria-hidden
            strokeWidth={1.5}
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Join the Beta
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Mini RV Parks is in private beta. We&apos;re adding hosts and
            listings and would love to have you as an early guest. Apply below
            and we&apos;ll be in touch.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/apply">Apply for beta access</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20" aria-labelledby="beta-benefits">
        <div className="mx-auto max-w-2xl">
          <h2 id="beta-benefits" className="text-center text-2xl font-bold text-foreground">
            What beta guests can do
          </h2>
          <ul className="mt-10 flex flex-col gap-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4"
              >
                <Icon
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                  strokeWidth={1.5}
                />
                <span className="text-foreground">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No guest account in beta — you&apos;ll enter your details when you
            submit a request. Beta approval lets you submit requests to book or
            store.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild>
              <Link href="/apply">Apply now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
