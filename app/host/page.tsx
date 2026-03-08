import Link from "next/link";
import { Home, Upload, Calendar, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Host Your Space — Mini RV Parks",
  description:
    "List your RV pad or storage space. Set your price, upload photos, and accept requests. Earn from your land with Mini RV Parks.",
};

const STEPS = [
  {
    icon: Home,
    title: "Create your listing",
    description:
      "Choose Stays (nightly) or Storage (monthly). Add a title, description, location, hookups, and photos. We need at least 5 photos so guests know what to expect.",
  },
  {
    icon: Calendar,
    title: "Set availability & price",
    description:
      "Stays: block or open dates and set a nightly rate. Storage: set monthly price and deposit. One slot per listing in beta.",
  },
  {
    icon: CheckCircle,
    title: "Accept requests",
    description:
      "Guests request to book; you accept or decline. After you accept, they have 24 hours to pay. No payment until you say yes.",
  },
] as const;

export default function HostPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 to-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Upload
            className="mx-auto size-12 text-emerald-600"
            aria-hidden
            strokeWidth={1.5}
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Host Your Space
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Have an RV pad or storage spot? List it on Mini RV Parks. Set your
            price, upload photos, and start earning. We handle the platform;
            you keep control of who stays and when.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            >
              <Link href="/host/login">Get started — host login</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20" aria-labelledby="how-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="how-heading" className="text-center text-2xl font-bold text-gray-900">
            How hosting works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="relative rounded-2xl border border-gray-100 bg-gray-50/50 p-6"
              >
                <span
                  className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white"
                  aria-hidden
                >
                  {i + 1}
                </span>
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
          <DollarSign
            className="mx-auto size-10 text-emerald-600"
            aria-hidden
            strokeWidth={1.5}
          />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            You set the price
          </h2>
          <p className="mt-2 text-gray-600">
            Nightly for stays, monthly + deposit for storage. Listings are
            reviewed before going live so we keep quality high.
          </p>
          <Button
            asChild
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
          >
            <Link href="/host/login">Host login</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
