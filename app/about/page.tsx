import Link from "next/link";
import { Truck, MapPin, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About — Mini RV Parks",
  description:
    "Mini RV Parks connects RV travelers with private pads and storage from real landowners. No big parks, no crowds — just great spots.",
};

const VALUES = [
  {
    icon: MapPin,
    title: "Real places, real people",
    description:
      "Every listing is from a landowner. No mega-parks or corporate campgrounds — just private pads with clear hookups and honest photos.",
  },
  {
    icon: Shield,
    title: "Request to book",
    description:
      "You request, the host accepts, then you pay. No surprise charges. We focus on Stays (nightly) and Storage (monthly) for RVs only.",
  },
  {
    icon: Users,
    title: "Built for the community",
    description:
      "We're in beta and growing with early hosts and guests. Quality over scale: verified locations and a simple, transparent flow.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 to-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Truck
            className="mx-auto size-12 text-emerald-600"
            aria-hidden
            strokeWidth={1.5}
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            About Mini RV Parks
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            We connect RV travelers with private pads and secure storage from
            real landowners. No tents, no cabins, no boondocking — just RV pads
            with clear hookups, strong photos, and a smooth request-to-book
            flow.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20" aria-labelledby="values-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="values-heading" className="sr-only">
            What we stand for
          </h2>
          <div className="grid gap-10 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6"
              >
                <Icon
                  className="size-8 text-emerald-600"
                  aria-hidden
                  strokeWidth={1.5}
                />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Ready to find your next spot?
          </h2>
          <p className="mt-2 text-gray-600">
            Search stays or storage — no account needed to browse.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            >
              <Link href="/">Search stays</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/storage">Search storage</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
