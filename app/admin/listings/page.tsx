"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, CheckCircle, Minus } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
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
  const { isAdmin, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("ALL");

  const fetchListings = useCallback(async (status?: string) => {
    const url = status
      ? `/api/admin/listings?status=${status}`
      : "/api/admin/listings";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setListings(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchListings(filter === "ALL" ? undefined : filter).finally(() =>
      setLoading(false)
    );
  }, [isAdmin, filter, fetchListings]);

  const filtered = useMemo(
    () =>
      filter === "ALL"
        ? listings
        : listings.filter((l) => l.status === filter),
    [listings, filter],
  );

  if (!authLoading && !isAdmin) {
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

  const handleAction = async (listingId: string, action: string) => {
    const res = await fetch(`/api/admin/listings/${listingId}/${action}`, {
      method: "POST",
    });
    if (res.ok) fetchListings(filter === "ALL" ? undefined : filter);
  };

  const handleVerify = async (listingId: string) => {
    const res = await fetch(`/api/admin/listings/${listingId}/verify`, {
      method: "POST",
    });
    if (res.ok) fetchListings(filter === "ALL" ? undefined : filter);
  };

  return (
    <main className="mx-auto max-w-6xl flex flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listing Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""}`}
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

      <div className="flex flex-col gap-3">
        {loading && (
          <p className="py-12 text-center text-muted-foreground">Loading listings…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No listings match this filter.</p>
        )}

        {!loading &&
          filtered.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onApprove={() => handleAction(listing.id, "approve")}
              onReject={() => handleAction(listing.id, "reject")}
              onSuspend={() => handleAction(listing.id, "suspend")}
              onToggleVerified={() => handleVerify(listing.id)}
            />
          ))}
      </div>
    </main>
  );
}

function ListingRow({
  listing,
  onApprove,
  onReject,
  onSuspend,
  onToggleVerified,
}: {
  listing: Listing;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onToggleVerified: () => void;
}) {
  const badge = STATUS_BADGE[listing.status];
  const photoUrl = listing.photos?.[0];

  return (
    <Card className="flex flex-col gap-0 py-0 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-4 p-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="56px"
              unoptimized={!photoUrl.includes("unsplash")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Minus className="size-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-1">
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
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={onReject}>
              Reject
            </Button>
          </>
        )}
        {listing.status === "LIVE" && (
          <Button size="sm" variant="destructive" onClick={onSuspend}>
            Suspend
          </Button>
        )}
        {listing.status === "SUSPENDED" && (
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onApprove}
          >
            Approve
          </Button>
        )}
        <Button
          size="sm"
          variant={listing.verified ? "outline" : "secondary"}
          onClick={onToggleVerified}
          aria-label={listing.verified ? "Remove verification" : "Verify listing"}
        >
          {listing.verified ? "Unverify" : "Verify"}
        </Button>
      </div>
    </Card>
  );
}
