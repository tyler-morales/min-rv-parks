"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, CheckCircle, Minus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Listing, ListingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type FilterTab = "ALL" | ListingStatus;

const STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  LIVE: { label: "Live", className: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-800" },
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
};

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "LIVE", label: "Live" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function AdminListingsPage() {
  const isAdmin = useAppStore((s) => s.isAdmin);
  const stayListings = useAppStore((s) => s.stayListings);
  const storageListings = useAppStore((s) => s.storageListings);
  const updateListingStatus = useAppStore((s) => s.updateListingStatus);
  const toggleVerified = useAppStore((s) => s.toggleVerified);

  const [filter, setFilter] = useState<FilterTab>("ALL");

  const allListings: Listing[] = useMemo(
    () =>
      [...stayListings, ...storageListings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [stayListings, storageListings],
  );

  const filtered = useMemo(
    () => (filter === "ALL" ? allListings : allListings.filter((l) => l.status === filter)),
    [allListings, filter],
  );

  if (!isAdmin) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Shield className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <Link
          href="/host/login"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Go to Host Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listing Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} listing{filtered.length !== 1 && "s"}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>

      <nav aria-label="Filter listings by status" className="flex gap-1 rounded-lg bg-muted p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            aria-pressed={filter === tab.value}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No listings match this filter.</p>
        )}

        {filtered.map((listing) => (
          <ListingRow
            key={listing.id}
            listing={listing}
            onStatusChange={updateListingStatus}
            onToggleVerified={toggleVerified}
          />
        ))}
      </div>
    </main>
  );
}

function ListingRow({
  listing,
  onStatusChange,
  onToggleVerified,
}: {
  listing: Listing;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onToggleVerified: (id: string) => void;
}) {
  const badge = STATUS_BADGE[listing.status];

  return (
    <Card className="flex flex-col gap-0 py-0 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-4 p-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
          <Image
            src={listing.photos[0]}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/admin/listings/${listing.id}`}
            className="line-clamp-1 font-medium hover:text-emerald-600 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {listing.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{listing.host.name}</span>
            <Badge
              className={
                listing.listingType === "STAY"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"
              }
            >
              {listing.listingType === "STAY" ? "Stay" : "Storage"}
            </Badge>
            <Badge className={badge.className}>{badge.label}</Badge>
            {listing.verified ? (
              <span className="inline-flex items-center gap-1 text-emerald-600" title="Verified">
                <CheckCircle className="size-3.5" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground" title="Not verified">
                <Minus className="size-3.5" />
                Unverified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t px-4 py-3 sm:border-t-0 sm:border-l sm:py-4">
        {listing.status === "PENDING" && (
          <>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => onStatusChange(listing.id, "LIVE")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusChange(listing.id, "SUSPENDED")}
            >
              Reject
            </Button>
          </>
        )}
        {listing.status === "LIVE" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onStatusChange(listing.id, "SUSPENDED")}
          >
            Suspend
          </Button>
        )}
        {listing.status === "SUSPENDED" && (
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => onStatusChange(listing.id, "LIVE")}
          >
            Approve
          </Button>
        )}
        <Button
          size="sm"
          variant={listing.verified ? "outline" : "secondary"}
          onClick={() => onToggleVerified(listing.id)}
          aria-label={listing.verified ? "Remove verification" : "Verify listing"}
        >
          {listing.verified ? "Unverify" : "Verify"}
        </Button>
      </div>
    </Card>
  );
}
