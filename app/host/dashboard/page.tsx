"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/use-auth";
import { formatPrice } from "@/lib/utils";
import type { Listing, ListingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Plus,
  ClipboardList,
  Home,
  Warehouse,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

const STATUS_STYLES: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  LIVE: {
    label: "Live",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface RequestSummary {
  id: string;
  guestName: string;
  listingTitle: string;
  type: "STAY" | "STORAGE";
  status: string;
  createdAt: string;
}

export default function HostDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [requestStats, setRequestStats] = useState({
    pendingReqs: 0,
    confirmed: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RequestSummary[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/host/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    fetch("/api/host/listings")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false));

    fetch("/api/host/requests")
      .then((res) => (res.ok ? res.json() : { bookingRequests: [], storageRequests: [] }))
      .then((data) => {
        const bookings = data.bookingRequests ?? [];
        const storage = data.storageRequests ?? [];

        const pendingReqs =
          bookings.filter((r: { status: string }) => r.status === "REQUESTED").length +
          storage.filter((r: { status: string }) => r.status === "REQUESTED").length;
        const confirmed =
          bookings.filter((r: { status: string }) => r.status === "ACCEPTED").length +
          storage.filter((r: { status: string }) => r.status === "ACCEPTED").length;

        setRequestStats({ pendingReqs, confirmed });

        const all: RequestSummary[] = [
          ...bookings.map(
            (r: Record<string, string>) =>
              ({
                id: r.id,
                guestName: r.guest_name,
                listingTitle: r.listing_title,
                type: "STAY" as const,
                status: r.status,
                createdAt: r.created_at,
              }),
          ),
          ...storage.map(
            (r: Record<string, string>) =>
              ({
                id: r.id,
                guestName: r.guest_name,
                listingTitle: r.listing_title,
                type: "STORAGE" as const,
                status: r.status,
                createdAt: r.created_at,
              }),
          ),
        ];
        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecentRequests(all.slice(0, 5));
      })
      .catch(() => {});
  }, [user]);

  if (authLoading || !user) return null;

  const activeLive = listings.filter((l) => l.status === "LIVE").length;

  const statCards = [
    {
      label: "Active Listings",
      value: activeLive,
      icon: Home,
      color: "text-emerald-600",
    },
    {
      label: "Pending Requests",
      value: requestStats.pendingReqs,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Total Bookings",
      value: requestStats.confirmed,
      icon: CheckCircle2,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="size-6 text-emerald-600" />
        <h1 className="text-2xl font-bold tracking-tight">Host Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Listings</h2>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
            render={<Link href="/host/listings/new" />}
            nativeButton={false}
          >
            <Plus className="size-4" />
            Create New Listing
          </Button>
        </div>

        {listingsLoading ? (
          <Card>
            <CardContent className="py-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No listings yet. Create your first listing to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const statusStyle = STATUS_STYLES[listing.status];
              const price =
                listing.listingType === "STAY"
                  ? `${formatPrice((listing as { nightlyPriceCents: number }).nightlyPriceCents)}/night`
                  : `${formatPrice((listing as { monthlyPriceCents: number }).monthlyPriceCents)}/mo`;
              const photoUrl = listing.photos?.[0];

              return (
                <Link
                  key={listing.id}
                  href={`/host/listings/${listing.id}`}
                  className="group rounded-xl ring-1 ring-foreground/10 transition-shadow hover:ring-2 hover:ring-emerald-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="h-full ring-0">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-muted">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt={listing.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized={!photoUrl.includes("unsplash")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Home className="size-12 opacity-40" />
                        </div>
                      )}
                    </div>
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium leading-snug line-clamp-2">
                          {listing.title}
                        </h3>
                        <span className="shrink-0 font-semibold text-emerald-700">
                          {price}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            listing.listingType === "STAY"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          }
                        >
                          {listing.listingType === "STAY" ? (
                            <Home className="mr-1 size-3" />
                          ) : (
                            <Warehouse className="mr-1 size-3" />
                          )}
                          {listing.listingType}
                        </Badge>
                        <Badge className={statusStyle.className}>
                          {statusStyle.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Requests</h2>
          <Button
            variant="outline"
            render={<Link href="/host/requests" />}
            nativeButton={false}
          >
            <ClipboardList className="size-4" />
            View All
          </Button>
        </div>

        {recentRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No requests yet. They&apos;ll appear here when guests request
              bookings.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {recentRequests.map((req) => (
              <Card key={req.id} size="sm">
                <CardContent className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-medium">{req.guestName}</span>
                    <span className="text-muted-foreground">
                      {req.listingTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        req.type === "STAY"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      }
                    >
                      {req.type}
                    </Badge>
                    <RequestStatusBadge status={req.status} />
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    REQUESTED:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    ACCEPTED:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    DECLINED:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    EXPIRED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <Badge className={styles[status] ?? styles.EXPIRED}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
