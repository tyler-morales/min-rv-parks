"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle, MapPin } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { StayListing, StorageListing } from "@/lib/types";
import { formatPrice } from "@/lib/mock-data";

function isStay(listing: StayListing | StorageListing): listing is StayListing {
  return listing.listingType === "STAY";
}

interface ListingCardProps {
  listing: StayListing | StorageListing;
  checkIn?: string;
  checkOut?: string;
}

export function ListingCard({ listing, checkIn, checkOut }: ListingCardProps) {
  const href = isStay(listing) ? `/stays/${listing.id}` : `/storage/${listing.id}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={listing.photos[0]}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="space-y-2 p-4">
        <h3 className="font-semibold leading-snug text-foreground line-clamp-1">
          {listing.title}
        </h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          Near {listing.nearTown}
        </p>

        <div className="flex flex-wrap gap-1">
          {isStay(listing) ? <StayBadges listing={listing} /> : <StorageBadges listing={listing} />}
        </div>

        <div className="flex items-center justify-between pt-1">
          {isStay(listing) ? (
            <StayPrice listing={listing} checkIn={checkIn} checkOut={checkOut} />
          ) : (
            <StoragePrice listing={listing} />
          )}
          {listing.verified && (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
              <CheckCircle className="size-3" />
              Verified
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

function StayBadges({ listing }: { listing: StayListing }) {
  return (
    <>
      {listing.electric !== "NONE" && (
        <Badge variant="secondary">⚡ {listing.electric}A</Badge>
      )}
      {listing.water && <Badge variant="secondary">💧 Water</Badge>}
      {listing.sewage && <Badge variant="secondary">Sewage</Badge>}
      {listing.gas && <Badge variant="secondary">Gas</Badge>}
      {listing.pullThrough && <Badge variant="secondary">Pull-through</Badge>}
    </>
  );
}

function StorageBadges({ listing }: { listing: StorageListing }) {
  const typeLabel = listing.storageType.charAt(0) + listing.storageType.slice(1).toLowerCase();
  const accessLabel =
    listing.access === "24_7"
      ? "24/7 Access"
      : listing.access === "DAYTIME_ONLY"
        ? "Daytime"
        : "Scheduled";

  return (
    <>
      <Badge variant="secondary">{typeLabel}</Badge>
      <Badge variant="secondary">{accessLabel}</Badge>
      {listing.securityFeatures.includes("GATED") && <Badge variant="secondary">Gated</Badge>}
      {listing.securityFeatures.includes("CAMERAS") && <Badge variant="secondary">Cameras</Badge>}
      {listing.powerAvailable && <Badge variant="secondary">⚡ Power</Badge>}
    </>
  );
}

function StayPrice({
  listing,
  checkIn,
  checkOut,
}: {
  listing: StayListing;
  checkIn?: string;
  checkOut?: string;
}) {
  if (checkIn && checkOut) {
    const nights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
    if (nights > 0) {
      return (
        <p className="text-lg font-bold text-foreground">
          {formatPrice(listing.nightlyPriceCents * nights)}{" "}
          <span className="text-sm font-normal text-muted-foreground">total</span>
        </p>
      );
    }
  }
  return (
    <p className="text-lg font-bold text-foreground">
      {formatPrice(listing.nightlyPriceCents)}{" "}
      <span className="text-sm font-normal text-muted-foreground">/ night</span>
    </p>
  );
}

function StoragePrice({ listing }: { listing: StorageListing }) {
  return (
    <div>
      <p className="text-lg font-bold text-foreground">
        {formatPrice(listing.monthlyPriceCents)}{" "}
        <span className="text-sm font-normal text-muted-foreground">/ month</span>
      </p>
      <p className="text-xs text-muted-foreground">
        deposit: {formatPrice(listing.depositCents)}
      </p>
    </div>
  );
}
