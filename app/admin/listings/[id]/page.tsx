"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/mock-data";
import type { Listing, ListingStatus, StayListing, StorageListing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 text-base px-3 py-1" },
  LIVE: { label: "Live", className: "bg-emerald-100 text-emerald-800 text-base px-3 py-1" },
  SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-800 text-base px-3 py-1" },
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700 text-base px-3 py-1" },
};

function isStay(listing: Listing): listing is StayListing {
  return listing.listingType === "STAY";
}

function isStorage(listing: Listing): listing is StorageListing {
  return listing.listingType === "STORAGE";
}

export default function AdminListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const stayListings = useAppStore((s) => s.stayListings);
  const storageListings = useAppStore((s) => s.storageListings);
  const updateListingStatus = useAppStore((s) => s.updateListingStatus);
  const toggleVerified = useAppStore((s) => s.toggleVerified);

  const listing: Listing | undefined = useMemo(
    () =>
      [...stayListings, ...storageListings].find((l) => l.id === id),
    [stayListings, storageListings, id],
  );

  if (!listing) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <Link
          href="/admin/listings"
          className="text-sm text-emerald-600 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Back to Listings
        </Link>
      </main>
    );
  }

  const badge = STATUS_BADGE[listing.status];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link
        href="/admin/listings"
        className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" />
        Back to Listings
      </Link>

      {/* Admin action bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Badge className={badge.className}>{badge.label}</Badge>

          <Separator orientation="vertical" className="hidden h-8 sm:block" />

          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch
              checked={listing.verified}
              onCheckedChange={() => toggleVerified(listing.id)}
              aria-label="Toggle verified status"
            />
            {listing.verified ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle className="size-4" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <XCircle className="size-4" /> Not verified
              </span>
            )}
          </label>

          <div className="ml-auto flex gap-2">
            {listing.status === "PENDING" && (
              <>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => updateListingStatus(listing.id, "LIVE")}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateListingStatus(listing.id, "SUSPENDED")}
                >
                  Reject
                </Button>
              </>
            )}
            {listing.status === "LIVE" && (
              <Button
                variant="destructive"
                onClick={() => updateListingStatus(listing.id, "SUSPENDED")}
              >
                Suspend
              </Button>
            )}
            {listing.status === "SUSPENDED" && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => updateListingStatus(listing.id, "LIVE")}
              >
                Re-activate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Listing photos">
        {listing.photos.map((src, i) => (
          <div
            key={i}
            className="relative h-48 w-72 shrink-0 overflow-hidden rounded-lg"
            role="listitem"
          >
            <Image src={src} alt={`${listing.title} photo ${i + 1}`} fill className="object-cover" sizes="288px" />
          </div>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{listing.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{listing.description}</p>
            <Separator />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{listing.listingType === "STAY" ? "Stay" : "Storage"}</dd>
              <dt className="text-muted-foreground">Near</dt>
              <dd className="font-medium">{listing.nearTown}</dd>
              <dt className="text-muted-foreground">Max Rig Length</dt>
              <dd className="font-medium">{listing.maxRigLength} ft</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(listing.createdAt).toLocaleDateString()}</dd>
              <dt className="text-muted-foreground">Listing ID</dt>
              <dd className="font-mono text-xs">{listing.id}</dd>

              {isStay(listing) && (
                <>
                  <dt className="text-muted-foreground">Nightly Price</dt>
                  <dd className="font-medium">{formatPrice(listing.nightlyPriceCents)}/night</dd>
                  <dt className="text-muted-foreground">Electric</dt>
                  <dd className="font-medium">{listing.electric === "NONE" ? "None" : `${listing.electric}A`}</dd>
                  <dt className="text-muted-foreground">Water</dt>
                  <dd className="font-medium">{listing.water ? "Yes" : "No"}</dd>
                  <dt className="text-muted-foreground">Sewage</dt>
                  <dd className="font-medium">{listing.sewage ? "Yes" : "No"}</dd>
                  <dt className="text-muted-foreground">Gas</dt>
                  <dd className="font-medium">{listing.gas ? "Yes" : "No"}</dd>
                  <dt className="text-muted-foreground">Slide-outs</dt>
                  <dd className="font-medium">{listing.slideOutsAllowed ? "Allowed" : "Not allowed"}</dd>
                  <dt className="text-muted-foreground">Pull-through</dt>
                  <dd className="font-medium">{listing.pullThrough ? "Yes" : "No"}</dd>
                  <dt className="text-muted-foreground">Stay Range</dt>
                  <dd className="font-medium">{listing.minStayNights}–{listing.maxStayNights} nights</dd>
                </>
              )}

              {isStorage(listing) && (
                <>
                  <dt className="text-muted-foreground">Monthly Price</dt>
                  <dd className="font-medium">{formatPrice(listing.monthlyPriceCents)}/mo</dd>
                  <dt className="text-muted-foreground">Deposit</dt>
                  <dd className="font-medium">{formatPrice(listing.depositCents)}</dd>
                  <dt className="text-muted-foreground">Storage Type</dt>
                  <dd className="font-medium capitalize">{listing.storageType.toLowerCase()}</dd>
                  <dt className="text-muted-foreground">Access</dt>
                  <dd className="font-medium">{listing.access.replace("_", "/")}</dd>
                  <dt className="text-muted-foreground">Security</dt>
                  <dd className="font-medium">{listing.securityFeatures.join(", ") || "None"}</dd>
                  <dt className="text-muted-foreground">Power</dt>
                  <dd className="font-medium">{listing.powerAvailable ? "Available" : "None"}</dd>
                  <dt className="text-muted-foreground">Min. Months</dt>
                  <dd className="font-medium">{listing.minimumMonths}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Host Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative size-14 overflow-hidden rounded-full">
                <Image
                  src={listing.host.avatar}
                  alt={listing.host.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <p className="font-medium">{listing.host.name}</p>
                <p className="text-sm text-muted-foreground">{listing.host.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(listing.host.joinedDate).toLocaleDateString()} · {listing.host.listingsCount} listing{listing.host.listingsCount !== 1 && "s"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
