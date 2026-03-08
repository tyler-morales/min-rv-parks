"use client";

import { useEffect, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { AccessType, SecurityFeature, StorageListing, StorageType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/map-view";

const STORAGE_TYPE_META: Record<StorageType, { label: string; icon: React.ReactNode }> = {
  OUTDOOR: { label: "Outdoor", icon: <Sun className="size-5" /> },
  COVERED: { label: "Covered", icon: <Warehouse className="size-5" /> },
  INDOOR: { label: "Indoor", icon: <Home className="size-5" /> },
};

const ACCESS_LABELS: Record<AccessType, string> = {
  "24_7": "24/7",
  DAYTIME_ONLY: "Daytime Only",
  SCHEDULED: "Scheduled",
};

const SECURITY_META: Record<Exclude<SecurityFeature, "NONE">, { label: string; icon: React.ReactNode }> = {
  GATED: { label: "Gated entry", icon: <Shield className="size-5" /> },
  CAMERAS: { label: "Security cameras", icon: <Camera className="size-5" /> },
  LIGHTING: { label: "Perimeter lighting", icon: <Lightbulb className="size-5" /> },
  ON_SITE_HOST: { label: "On-site host", icon: <User className="size-5" /> },
};

export default function StorageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<StorageListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [moveIn, setMoveIn] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.listingType === "STORAGE") setListing(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
          The storage listing you&rsquo;re looking for doesn&rsquo;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="mr-1 size-4" data-icon="inline-start" />
          Back to search
        </Link>
      </main>
    );
  }

  const storeHref = moveIn ? `/store/${listing.id}?moveIn=${moveIn}` : "#";
  const typeMeta = STORAGE_TYPE_META[listing.storageType];
  const securityItems = listing.securityFeatures.filter(
    (f): f is Exclude<SecurityFeature, "NONE"> => f !== "NONE",
  );

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Back to search results"
      >
        <ChevronLeft className="mr-1 size-4" data-icon="inline-start" />
        Back
      </Link>

      {/* Photo Gallery */}
      <section aria-label="Photo gallery" className="mb-8">
        <div className="hidden gap-2 overflow-hidden rounded-xl md:grid md:grid-cols-2 md:grid-rows-2 md:h-[420px]">
          {listing.photos[0] && (
            <div className="relative row-span-2">
              <Image src={listing.photos[0]} alt={`${listing.title} — main photo`} fill className="object-cover" sizes="50vw" priority />
            </div>
          )}
          {listing.photos.slice(1, 5).map((src, i) => (
            <div key={i} className="relative">
              <Image src={src} alt={`${listing.title} — photo ${i + 2}`} fill className="object-cover" sizes="25vw" />
            </div>
          ))}
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:hidden">
          {listing.photos[0] && (
            <Image src={listing.photos[0]} alt={`${listing.title} — main photo`} fill className="object-cover" sizes="100vw" priority />
          )}
          <button
            type="button"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Show all ${listing.photos.length} photos`}
          >
            <Images className="size-4" data-icon="inline-start" />
            Show all photos
          </button>
        </div>
      </section>

      {/* Content + Sidebar */}
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            <span>Near {listing.nearTown}</span>
            {listing.verified && (
              <Badge variant="secondary" className="ml-1 gap-1 text-primary">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Verified
              </Badge>
            )}
          </div>

          <Separator className="my-6" />
          <p className="leading-relaxed text-muted-foreground">{listing.description}</p>

          <Separator className="my-6" />

          <section aria-labelledby="storage-details-heading">
            <h2 id="storage-details-heading" className="mb-4 text-lg font-semibold">Storage Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <DetailItem icon={typeMeta.icon} label="Storage type" value={typeMeta.label} />
              <DetailItem icon={<Clock className="size-5" />} label="Access" value={ACCESS_LABELS[listing.access]} />
              <DetailItem icon={<Ruler className="size-5" />} label="Max rig length" value={`${listing.maxRigLength} ft`} />
            </div>
          </section>

          <Separator className="my-6" />

          <section aria-labelledby="security-heading">
            <h2 id="security-heading" className="mb-4 text-lg font-semibold">Security</h2>
            {securityItems.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {securityItems.map((feat) => {
                  const meta = SECURITY_META[feat];
                  return (
                    <li key={feat} className="flex items-center gap-3 text-sm">
                      <span className="text-primary" aria-hidden="true">{meta.icon}</span>
                      {meta.label}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No security features listed.</p>
            )}
          </section>

          <Separator className="my-6" />

          <section aria-labelledby="power-heading">
            <h2 id="power-heading" className="mb-3 text-lg font-semibold">Power</h2>
            <div className={`flex items-center gap-3 text-sm ${listing.powerAvailable ? "" : "opacity-40"}`}>
              <Plug className={`size-5 ${listing.powerAvailable ? "text-amber-500" : "text-muted-foreground"}`} />
              <span>Power hookup: <span className="font-medium">{listing.powerAvailable ? "Available" : "Not available"}</span></span>
            </div>
          </section>

          <Separator className="my-6" />

          {listing.noLivingOnSite && (
            <>
              <section aria-labelledby="rules-heading">
                <h2 id="rules-heading" className="mb-3 text-lg font-semibold">Rules</h2>
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" role="alert">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <span><strong>No living on site.</strong> This is a storage-only facility — overnight stays in your RV are not permitted.</span>
                </div>
              </section>
              <Separator className="my-6" />
            </>
          )}

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
              <Image src={listing.host.avatar} alt={listing.host.name} width={56} height={56} className="rounded-full" />
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
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{formatPrice(listing.monthlyPriceCents)}<span className="font-normal text-muted-foreground"> / month</span></CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 p-6 pt-0">

                <div className="text-sm text-muted-foreground">
                  Deposit: <span className="font-semibold text-foreground">{formatPrice(listing.depositCents)}</span>
                </div>

                <div>
                  <label htmlFor="move-in" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Move-in date</label>
                  <Input id="move-in" type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} aria-label="Move-in date" />
                </div>

                <p className="text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 inline size-3.5" aria-hidden="true" />
                  Minimum {listing.minimumMonths} month{listing.minimumMonths !== 1 && "s"}
                </p>

                {moveIn ? (
                  <Button asChild className="w-full">
                    <Link
                      href={storeHref}
                      aria-label="Request storage for your RV"
                    >
                      Request Storage
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" disabled>Select move-in date</Button>
                )}

                <p className="text-center text-xs text-muted-foreground">You won&rsquo;t be charged yet</p>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* Mobile fixed bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <span className="text-lg font-bold">{formatPrice(listing.monthlyPriceCents)}</span>
            <span className="text-sm text-muted-foreground"> / month</span>
          </div>
          <Button asChild>
            <Link
              href={storeHref}
              aria-label="Request storage for your RV"
            >
              Request Storage
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
      <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
      <span className="text-sm font-medium">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
