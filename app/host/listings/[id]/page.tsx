"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home, Pencil, Trash2, Warehouse } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { formatPrice } from "@/lib/utils";
import type { Listing, ListingStatus, StayListing, StorageListing } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  PENDING: { label: "Pending review", className: "bg-yellow-100 text-yellow-800" },
  LIVE: { label: "Live", className: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-800" },
};

function isStay(listing: Listing): listing is StayListing {
  return listing.listingType === "STAY";
}

function isStorage(listing: Listing): listing is StorageListing {
  return listing.listingType === "STORAGE";
}

export default function HostListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchListing = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/host/listings/${id}`);
    if (!res.ok) {
      setListing(null);
      return;
    }
    const data = await res.json();
    setListing(data);
  }, [id]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchListing().finally(() => setLoading(false));
  }, [user, fetchListing]);

  if (!authLoading && !user) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <Link href="/host/login" className="text-sm text-emerald-600 hover:underline">
          Host Login
        </Link>
      </main>
    );
  }

  if (loading || !listing) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-muted-foreground">
          {loading ? "Loading…" : "Listing not found."}
        </p>
        <Link href="/host/dashboard" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const badge = STATUS_BADGE[listing.status];
  const photos = listing.photos ?? [];

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/host/listings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to delete");
      }
      setDeleteOpen(false);
      router.push("/host/dashboard");
    } catch (e) {
      setDeleting(false);
      throw e;
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/host/dashboard"
          className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/host/listings/${id}/edit`}
              className="inline-flex items-center gap-1.5"
              aria-label="Edit listing"
            >
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-500/50"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete listing"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={badge.className}>{badge.label}</Badge>
        <Badge
          className={
            listing.listingType === "STAY"
              ? "bg-blue-100 text-blue-800"
              : "bg-purple-100 text-purple-800"
          }
        >
          {listing.listingType === "STAY" ? (
            <Home className="mr-1 size-3" />
          ) : (
            <Warehouse className="mr-1 size-3" />
          )}
          {listing.listingType}
        </Badge>
      </div>

      {photos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Listing photos">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative h-48 w-72 shrink-0 overflow-hidden rounded-lg bg-muted"
              role="listitem"
            >
              <Image
                src={src}
                alt={`${listing.title} photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="288px"
                unoptimized={!src.includes("unsplash")}
              />
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{listing.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{listing.nearTown}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{listing.description}</p>
          <Separator />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Max Rig Length</dt>
            <dd className="font-medium">{listing.maxRigLength} ft</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{badge.label}</dd>
            {isStay(listing) && (
              <>
                <dt className="text-muted-foreground">Nightly Price</dt>
                <dd className="font-medium">{formatPrice(listing.nightlyPriceCents)}/night</dd>
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
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="delete-listing-description"
          aria-labelledby="delete-listing-title"
        >
          <DialogHeader>
            <DialogTitle id="delete-listing-title">Delete listing?</DialogTitle>
            <DialogDescription id="delete-listing-description">
              This will permanently remove &quot;{listing.title}&quot;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              aria-busy={deleting}
            >
              {deleting ? "Deleting…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
