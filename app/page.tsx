"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MessageSquare, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeocoderInput, type GeocoderResult } from "@/components/geocoder-input";
import { useAppStore } from "@/lib/store";

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

const DESTINATIONS = [
  { name: "Texas Hill Country", gradient: "from-amber-700 to-orange-500", lat: 30.27, lng: -98.87 },
  { name: "Florida Keys", gradient: "from-cyan-600 to-teal-400", lat: 24.66, lng: -81.55 },
  { name: "Arizona Desert", gradient: "from-red-700 to-amber-500", lat: 33.45, lng: -111.94 },
  { name: "Colorado Mountains", gradient: "from-emerald-700 to-sky-500", lat: 39.55, lng: -105.78 },
] as const;

const STEPS = [
  {
    icon: Search,
    title: "Search",
    description: "Browse private RV pads and storage near your destination",
  },
  {
    icon: MessageSquare,
    title: "Request",
    description: "Submit a request to book. The host reviews and accepts.",
  },
  {
    icon: CheckCircle,
    title: "Book & Go",
    description: "Pay securely after the host accepts. Show up and enjoy.",
  },
] as const;

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Host Your Space", href: "/host" },
  { label: "Join Beta", href: "/beta" },
  { label: "Support", href: "/support" },
] as const;

export default function Home() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useAppStore();

  const [destination, setDestination] = useState("");
  const [geo, setGeo] = useState<GeocoderResult | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [radius, setRadius] = useState(25);

  function buildParams(lat: number, lng: number, label: string) {
    const params = new URLSearchParams({
      destination: label,
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
    });
    return params;
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!geo) return;

    if (activeTab === "stays") {
      const params = buildParams(geo.lat, geo.lng, geo.label);
      if (checkIn) params.set("checkIn", checkIn);
      if (checkOut) params.set("checkOut", checkOut);
      router.push(`/stays?${params}`);
    } else {
      const params = buildParams(geo.lat, geo.lng, geo.label);
      if (moveIn) params.set("moveIn", moveIn);
      router.push(`/storage?${params}`);
    }
  }

  function handleDestinationClick(dest: typeof DESTINATIONS[number]) {
    const params = buildParams(dest.lat, dest.lng, dest.name);
    router.push(`/stays?${params}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[520px] flex-col items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 px-4 py-24 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Private RV Pads
            <br />
            from Real Landowners
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-primary-foreground/90 sm:text-xl">
            No big parks. No crowds. Just great spots.
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="relative z-10 mx-auto mt-10 w-full max-w-3xl rounded-2xl bg-background p-2 shadow-xl sm:p-3"
          role="search"
          aria-label="Search RV pads"
        >
          {/* Tabs */}
          <div className="mb-3 flex gap-1 border-b border-border pb-2" role="tablist">
            {(["stays", "storage"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`panel-${tab}`}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  activeTab === tab
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-0 sm:divide-x sm:divide-border"
          >
            {/* Destination (geocoder) */}
            <div className="flex-1 px-2 sm:px-3">
              <label htmlFor="destination" className="mb-1 block text-xs font-medium text-muted-foreground">
                Destination
              </label>
              <GeocoderInput
                value={destination}
                onChange={setDestination}
                onSelect={(result) => {
                  setGeo(result);
                  setDestination(result.label);
                }}
                placeholder="Where to?"
              />
            </div>

            {/* Date inputs */}
            {activeTab === "stays" ? (
              <div className="flex flex-1 gap-2 px-2 sm:gap-0 sm:divide-x sm:divide-border sm:px-0">
                <div className="flex-1 px-2 sm:px-3">
                  <label htmlFor="check-in" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Check-in
                  </label>
                  <input
                    id="check-in"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent py-1.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div className="flex-1 px-2 sm:px-3">
                  <label htmlFor="check-out" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Check-out
                  </label>
                  <input
                    id="check-out"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent py-1.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 px-2 sm:px-3">
                <label htmlFor="move-in" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Move-in date
                </label>
                <input
                  id="move-in"
                  type="date"
                  value={moveIn}
                  onChange={(e) => setMoveIn(e.target.value)}
                  className="w-full bg-transparent py-1.5 text-sm text-foreground focus:outline-none"
                />
              </div>
            )}

            {/* Radius */}
            <div className="px-2 sm:px-3">
              <label htmlFor="radius" className="mb-1 block text-xs font-medium text-muted-foreground">
                Radius
              </label>
              <select
                id="radius"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full bg-transparent py-1.5 text-sm text-foreground focus:outline-none"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} miles
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="px-2 sm:px-1">
              <Button
                type="submit"
                disabled={!geo}
                className="w-full sm:w-auto"
              >
                <Search className="size-4" data-icon="inline-start" aria-hidden="true" />
                <span>Search</span>
              </Button>
            </div>
          </div>
        </form>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-background px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
            Three simple steps to your next adventure
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-border bg-muted/50 p-8 text-center transition-shadow hover:shadow-md"
              >
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <step.icon
                  className="mx-auto size-10 text-primary"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="bg-muted px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
            Popular Destinations
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
            Explore unique private pads across the country
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DESTINATIONS.map((dest) => (
              <button
                key={dest.name}
                onClick={() => handleDestinationClick(dest)}
                className="group relative flex h-48 items-end overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-left transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${dest.gradient} transition-opacity group-hover:opacity-90`}
                />
                <div className="relative z-10 flex w-full items-center justify-between">
                  <span className="text-lg font-semibold text-white drop-shadow-sm">
                    {dest.name}
                  </span>
                  <ChevronRight
                    className="size-5 text-white/80 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-foreground px-4 py-12 text-muted-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-background focus-visible:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-xs text-muted-foreground">&copy; 2026 Mini RV Parks</p>
        </div>
      </footer>
    </div>
  );
}
