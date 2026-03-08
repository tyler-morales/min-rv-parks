"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  BadgeCheck,
  Zap,
  Droplets,
  Pipette,
  Flame,
  Ruler,
  ArrowLeftRight,
  MoveRight,
  CalendarDays,
  ChevronLeft,
  Images,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapView } from "@/components/map-view";
import type { StayListing } from "@/lib/types";

function diffNights(checkIn: string, checkOut: string): number {
  const msPerDay = 86_400_000;
  return Math.max(
    0,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay,
    ),
  );
}

export default function StayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<StayListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.listingType === "STAY") setListing(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const nights = useMemo(
    () => (checkIn && checkOut ? diffNights(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );

  const total = listing ? nights * listing.nightlyPriceCents : 0;

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground">
          The stay you&rsquo;re looking for doesn&rsquo;t exist or has been
          removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to search
        </Link>
      </main>
    );
  }

  const bookHref =
    nights > 0
      ? `/book/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}`
      : "#";

  const electricLabel =
    listing.electric === "NONE" ? "None" : `${listing.electric} Amp`;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label="Back to search results"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back
      </Link>

      {/* Photo Gallery */}
      <section aria-label="Photo gallery" className="mb-8">
        <div className="hidden gap-2 overflow-hidden rounded-xl md:grid md:grid-cols-2 md:grid-rows-2 md:h-[420px]">
          {listing.photos[0] && (
            <div className="relative row-span-2">
              <Image
                src={listing.photos[0]}
                alt={`${listing.title} — main photo`}
                fill
                className="object-cover"
                sizes="50vw"
                priority
              />
            </div>
          )}
          {listing.photos.slice(1, 5).map((src, i) => (
            <div key={i} className="relative">
              <Image
                src={src}
                alt={`${listing.title} — photo ${i + 2}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
          ))}
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:hidden">
          {listing.photos[0] && (
            <Image
              src={listing.photos[0]}
              alt={`${listing.title} — main photo`}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          )}
          <button
            type="button"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 shadow backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={`Show all ${listing.photos.length} photos`}
          >
            <Images className="h-4 w-4" />
            Show all photos
          </button>
        </div>
      </section>

      {/* Content + Sidebar */}
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>Near {listing.nearTown}</span>
            {listing.verified && (
              <Badge variant="secondary" className="ml-1 gap-1 text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </Badge>
            )}
          </div>

          <Separator className="my-6" />
          <p className="leading-relaxed text-muted-foreground">{listing.description}</p>

          <Separator className="my-6" />

          <section aria-labelledby="rv-fit-heading">
            <h2 id="rv-fit-heading" className="mb-4 text-lg font-semibold">RV Fit</h2>
            <div className="grid grid-cols-3 gap-4">
              <FitItem icon={<Ruler className="h-5 w-5" />} label="Max rig length" value={`${listing.maxRigLength} ft`} />
              <FitItem icon={<ArrowLeftRight className="h-5 w-5" />} label="Slide-outs" value={listing.slideOutsAllowed ? "Yes" : "No"} />
              <FitItem icon={<MoveRight className="h-5 w-5" />} label="Pull-through" value={listing.pullThrough ? "Yes" : "No"} />
            </div>
          </section>

          <Separator className="my-6" />

          <section aria-labelledby="hookups-heading">
            <h2 id="hookups-heading" className="mb-4 text-lg font-semibold">Hookups &amp; Features</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <HookupRow icon={<Zap className="h-5 w-5 text-amber-500" />} label="Electric" value={electricLabel} available={listing.electric !== "NONE"} />
              <HookupRow icon={<Droplets className="h-5 w-5 text-blue-500" />} label="Water" value={listing.water ? "Yes" : "No"} available={listing.water} />
              <HookupRow icon={<Pipette className="h-5 w-5 text-gray-500" />} label="Sewage" value={listing.sewage ? "Yes" : "No"} available={listing.sewage} />
              <HookupRow icon={<Flame className="h-5 w-5 text-orange-500" />} label="Gas (propane)" value={listing.gas ? "Yes" : "No"} available={listing.gas} />
            </div>
          </section>

          <Separator className="my-6" />

          <section aria-labelledby="rules-heading">
            <h2 id="rules-heading" className="mb-3 text-lg font-semibold">Rules</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Minimum stay: {listing.minStayNights} night{listing.minStayNights !== 1 && "s"}
              </li>
              <li className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Maximum stay: {listing.maxStayNights} night{listing.maxStayNights !== 1 && "s"}
              </li>
            </ul>
          </section>

          <Separator className="my-6" />

          <section aria-labelledby="location-heading">
            <h2 id="location-heading" className="mb-3 text-lg font-semibold">Location</h2>
            <p className="mb-3 text-sm text-muted-foreground">Near {listing.nearTown}</p>
            <MapView
              listings={[listing]}
              centerLat={listing.publicLat}
              centerLng={listing.publicLng}
            />
          </section>

          <Separator className="my-6" />

          <section aria-labelledby="host-heading" className="flex items-center gap-4">
            {listing.host.avatar && (
              <Image
                src={listing.host.avatar}
                alt={listing.host.name}
                width={56}
                height={56}
                className="rounded-full"
              />
            )}
            <div>
              <h2 id="host-heading" className="font-semibold">Hosted by {listing.host.name}</h2>
              {listing.host.joinedDate && (
                <p className="text-sm text-muted-foreground">
                  Joined {new Date(listing.host.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <BookingCard
              listing={listing}
              checkIn={checkIn}
              checkOut={checkOut}
              nights={nights}
              total={total}
              bookHref={bookHref}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
            />
          </div>
        </aside>
      </div>

      {/* Mobile fixed bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-4 lg:hidden dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <span className="text-lg font-bold">{formatPrice(listing.nightlyPriceCents)}</span>
            <span className="text-sm text-muted-foreground"> / night</span>
          </div>
          <Link
            href={bookHref}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Request to book this stay"
          >
            Request to Book
          </Link>
        </div>
      </div>
    </main>
  );
}

function FitItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
      <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
      <span className="text-sm font-medium">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function HookupRow({ icon, label, value, available }: { icon: React.ReactNode; label: string; value: string; available: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg p-2 ${available ? "" : "opacity-40"}`}>
      {icon}
      <div className="text-sm">
        <span className="font-medium">{label}:</span> <span className="text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

function BookingCard({
  listing,
  checkIn,
  checkOut,
  nights,
  total,
  bookHref,
  onCheckInChange,
  onCheckOutChange,
}: {
  listing: { nightlyPriceCents: number; minStayNights: number; maxStayNights: number; id: string };
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  bookHref: string;
  onCheckInChange: (v: string) => void;
  onCheckOutChange: (v: string) => void;
}) {
  return (
    <Card className="shadow-lg">
      <CardContent className="space-y-5 p-6">
        <div>
          <span className="text-2xl font-bold">{formatPrice(listing.nightlyPriceCents)}</span>
          <span className="text-muted-foreground"> / night</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="check-in" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Check-in</label>
            <Input id="check-in" type="date" value={checkIn} onChange={(e) => onCheckInChange(e.target.value)} aria-label="Check-in date" />
          </div>
          <div>
            <label htmlFor="check-out" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Check-out</label>
            <Input id="check-out" type="date" value={checkOut} onChange={(e) => onCheckOutChange(e.target.value)} aria-label="Check-out date" />
          </div>
        </div>

        {nights > 0 && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{nights} night{nights !== 1 && "s"} &times; {formatPrice(listing.nightlyPriceCents)}/night</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {nights > 0 ? (
          <Link
            href={bookHref}
            className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Request to book this stay"
          >
            Request to Book
          </Link>
        ) : (
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled>
            Select dates to book
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">You won&rsquo;t be charged yet</p>
        <p className="text-xs text-muted-foreground">{listing.minStayNights}–{listing.maxStayNights} night stay</p>
      </CardContent>
    </Card>
  );
}
