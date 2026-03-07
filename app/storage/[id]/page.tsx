"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  BadgeCheck,
  Shield,
  Camera,
  Lightbulb,
  User,
  Plug,
  Ruler,
  Clock,
  Warehouse,
  CalendarDays,
  ChevronLeft,
  Images,
  AlertTriangle,
  Home,
  Sun,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/mock-data";
import type { AccessType, SecurityFeature, StorageType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const STORAGE_TYPE_META: Record<
  StorageType,
  { label: string; icon: React.ReactNode }
> = {
  OUTDOOR: { label: "Outdoor", icon: <Sun className="h-5 w-5" /> },
  COVERED: { label: "Covered", icon: <Warehouse className="h-5 w-5" /> },
  INDOOR: { label: "Indoor", icon: <Home className="h-5 w-5" /> },
};

const ACCESS_LABELS: Record<AccessType, string> = {
  "24_7": "24/7",
  DAYTIME_ONLY: "Daytime Only",
  SCHEDULED: "Scheduled",
};

const SECURITY_META: Record<
  Exclude<SecurityFeature, "NONE">,
  { label: string; icon: React.ReactNode }
> = {
  GATED: { label: "Gated entry", icon: <Shield className="h-5 w-5" /> },
  CAMERAS: {
    label: "Security cameras",
    icon: <Camera className="h-5 w-5" />,
  },
  LIGHTING: {
    label: "Perimeter lighting",
    icon: <Lightbulb className="h-5 w-5" />,
  },
  ON_SITE_HOST: {
    label: "On-site host",
    icon: <User className="h-5 w-5" />,
  },
};

export default function StorageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const listing = useAppStore((s) =>
    s.storageListings.find((l) => l.id === id),
  );

  const [moveIn, setMoveIn] = useState("");

  if (!listing) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground">
          The storage listing you&rsquo;re looking for doesn&rsquo;t exist or
          has been removed.
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

  const storeHref = moveIn
    ? `/store/${listing.id}?moveIn=${moveIn}`
    : "#";

  const typeMeta = STORAGE_TYPE_META[listing.storageType];
  const securityItems = listing.securityFeatures.filter(
    (f): f is Exclude<SecurityFeature, "NONE"> => f !== "NONE",
  );

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label="Back to search results"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back
      </Link>

      {/* ── Photo Gallery ── */}
      <section aria-label="Photo gallery" className="mb-8">
        {/* Desktop grid */}
        <div className="hidden gap-2 overflow-hidden rounded-xl md:grid md:grid-cols-2 md:grid-rows-2 md:h-[420px]">
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

        {/* Mobile hero */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:hidden">
          <Image
            src={listing.photos[0]}
            alt={`${listing.title} — main photo`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
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

      {/* ── Content + Sidebar ── */}
      <div className="grid gap-12 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2">
          {/* Title & location */}
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>Near {listing.nearTown}</span>
            {listing.verified && (
              <Badge
                variant="secondary"
                className="ml-1 gap-1 text-emerald-700"
              >
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </Badge>
            )}
          </div>

          <Separator className="my-6" />

          {/* Description */}
          <p className="leading-relaxed text-muted-foreground">
            {listing.description}
          </p>

          <Separator className="my-6" />

          {/* Storage Details */}
          <section aria-labelledby="storage-details-heading">
            <h2
              id="storage-details-heading"
              className="mb-4 text-lg font-semibold"
            >
              Storage Details
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <DetailItem
                icon={typeMeta.icon}
                label="Storage type"
                value={typeMeta.label}
              />
              <DetailItem
                icon={<Clock className="h-5 w-5" />}
                label="Access"
                value={ACCESS_LABELS[listing.access]}
              />
              <DetailItem
                icon={<Ruler className="h-5 w-5" />}
                label="Max rig length"
                value={`${listing.maxRigLength} ft`}
              />
            </div>
          </section>

          <Separator className="my-6" />

          {/* Security */}
          <section aria-labelledby="security-heading">
            <h2 id="security-heading" className="mb-4 text-lg font-semibold">
              Security
            </h2>
            {securityItems.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {securityItems.map((feat) => {
                  const meta = SECURITY_META[feat];
                  return (
                    <li key={feat} className="flex items-center gap-3 text-sm">
                      <span className="text-emerald-600" aria-hidden="true">
                        {meta.icon}
                      </span>
                      {meta.label}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No security features listed.
              </p>
            )}
          </section>

          <Separator className="my-6" />

          {/* Power */}
          <section aria-labelledby="power-heading">
            <h2 id="power-heading" className="mb-3 text-lg font-semibold">
              Power
            </h2>
            <div
              className={`flex items-center gap-3 text-sm ${listing.powerAvailable ? "" : "opacity-40"}`}
            >
              <Plug
                className={`h-5 w-5 ${listing.powerAvailable ? "text-amber-500" : "text-muted-foreground"}`}
              />
              <span>
                Power hookup:{" "}
                <span className="font-medium">
                  {listing.powerAvailable ? "Available" : "Not available"}
                </span>
              </span>
            </div>
          </section>

          <Separator className="my-6" />

          {/* Rules / no-living warning */}
          {listing.noLivingOnSite && (
            <>
              <section aria-labelledby="rules-heading">
                <h2 id="rules-heading" className="mb-3 text-lg font-semibold">
                  Rules
                </h2>
                <div
                  className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                  role="alert"
                >
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>No living on site.</strong> This is a storage-only
                    facility — overnight stays in your RV are not permitted.
                  </span>
                </div>
              </section>
              <Separator className="my-6" />
            </>
          )}

          {/* Location placeholder */}
          <section aria-labelledby="location-heading">
            <h2 id="location-heading" className="mb-3 text-lg font-semibold">
              Location
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Near {listing.nearTown}
            </p>
            <div
              className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-sm text-muted-foreground dark:bg-gray-800"
              role="img"
              aria-label={`Map placeholder — Near ${listing.nearTown}`}
            >
              Map &mdash; Near {listing.nearTown}
            </div>
          </section>

          <Separator className="my-6" />

          {/* Host info */}
          <section
            aria-labelledby="host-heading"
            className="flex items-center gap-4"
          >
            <Image
              src={listing.host.avatar}
              alt={listing.host.name}
              width={56}
              height={56}
              className="rounded-full"
            />
            <div>
              <h2 id="host-heading" className="font-semibold">
                Hosted by {listing.host.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Joined{" "}
                {new Date(listing.host.joinedDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </section>
        </div>

        {/* ── Right sidebar (desktop) ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <Card className="shadow-lg">
              <CardContent className="space-y-5 p-6">
                <div>
                  <span className="text-2xl font-bold">
                    {formatPrice(listing.monthlyPriceCents)}
                  </span>
                  <span className="text-muted-foreground"> / month</span>
                </div>

                <div className="text-sm text-muted-foreground">
                  Deposit:{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(listing.depositCents)}
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="move-in"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Move-in date
                  </label>
                  <Input
                    id="move-in"
                    type="date"
                    value={moveIn}
                    onChange={(e) => setMoveIn(e.target.value)}
                    aria-label="Move-in date"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  <CalendarDays
                    className="mr-1 inline h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Minimum {listing.minimumMonths} month
                  {listing.minimumMonths !== 1 && "s"}
                </p>

                {moveIn ? (
                  <Link
                    href={storeHref}
                    className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label="Request storage for your RV"
                  >
                    Request Storage
                  </Link>
                ) : (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled
                  >
                    Select move-in date
                  </Button>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  You won&rsquo;t be charged yet
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* ── Mobile fixed bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-4 lg:hidden dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <span className="text-lg font-bold">
              {formatPrice(listing.monthlyPriceCents)}
            </span>
            <span className="text-sm text-muted-foreground"> / month</span>
          </div>
          <Link
            href={storeHref}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Request storage for your RV"
          >
            Request Storage
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-component ─── */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
      <span className="text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <span className="text-sm font-medium">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
