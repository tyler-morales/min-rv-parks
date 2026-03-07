"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { formatPrice, formatPriceDecimal } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ClipboardList,
  Home,
  Warehouse,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { RequestStatus } from "@/lib/types";

type FilterTab = "all" | "stays" | "storage" | "pending" | "accepted" | "declined";

interface NormalizedRequest {
  id: string;
  kind: "STAY" | "STORAGE";
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  listingTitle: string;
  status: RequestStatus;
  dateLabel: string;
  priceLabel: string;
  expiresAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  REQUESTED: {
    label: "Requested",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  DECLINED: {
    label: "Declined",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  CANCELLED_BY_GUEST: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  CANCELLED_BY_HOST: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
};

export default function HostRequestsPage() {
  const router = useRouter();
  const {
    isHostLoggedIn,
    hostId,
    bookingRequests,
    storageRequests,
    updateBookingRequestStatus,
    updateStorageRequestStatus,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    if (!isHostLoggedIn) router.replace("/host/login");
  }, [isHostLoggedIn, router]);

  const normalizedRequests = useMemo<NormalizedRequest[]>(() => {
    const bookings: NormalizedRequest[] = bookingRequests
      .filter((r) => r.listing.hostId === hostId)
      .map((r) => ({
        id: r.id,
        kind: "STAY",
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone,
        listingTitle: r.listing.title,
        status: r.status,
        dateLabel: `${fmtDate(r.checkIn)} – ${fmtDate(r.checkOut)}`,
        priceLabel: `Total: ${formatPriceDecimal(r.totalPriceCents)}`,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      }));

    const storage: NormalizedRequest[] = storageRequests
      .filter((r) => r.listing.hostId === hostId)
      .map((r) => ({
        id: r.id,
        kind: "STORAGE",
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone,
        listingTitle: r.listing.title,
        status: r.status,
        dateLabel: `Move-in ${fmtDate(r.moveInDate)} · ${r.months} month${r.months !== 1 ? "s" : ""}`,
        priceLabel: `${formatPrice(r.monthlyPriceCents)}/mo + ${formatPrice(r.depositCents)} deposit`,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      }));

    return [...bookings, ...storage].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [bookingRequests, storageRequests, hostId]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "stays":
        return normalizedRequests.filter((r) => r.kind === "STAY");
      case "storage":
        return normalizedRequests.filter((r) => r.kind === "STORAGE");
      case "pending":
        return normalizedRequests.filter((r) => r.status === "REQUESTED");
      case "accepted":
        return normalizedRequests.filter((r) => r.status === "ACCEPTED");
      case "declined":
        return normalizedRequests.filter((r) => r.status === "DECLINED");
      default:
        return normalizedRequests;
    }
  }, [normalizedRequests, activeTab]);

  function handleAccept(req: NormalizedRequest) {
    if (req.kind === "STAY") {
      updateBookingRequestStatus(req.id, "ACCEPTED");
    } else {
      updateStorageRequestStatus(req.id, "ACCEPTED");
    }
  }

  function handleDecline(req: NormalizedRequest) {
    if (req.kind === "STAY") {
      updateBookingRequestStatus(req.id, "DECLINED");
    } else {
      updateStorageRequestStatus(req.id, "DECLINED");
    }
  }

  if (!isHostLoggedIn) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="size-6 text-emerald-600" />
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FilterTab)}
      >
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="stays">Stays</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No requests match this filter.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  onAccept={() => handleAccept(req)}
                  onDecline={() => handleDecline(req)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestCard({
  req,
  onAccept,
  onDecline,
}: {
  req: NormalizedRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const style = STATUS_STYLES[req.status] ?? STATUS_STYLES.EXPIRED;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {/* Header: guest + status */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{req.guestName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" />
                {req.guestEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" />
                {req.guestPhone}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                req.kind === "STAY"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
              }
            >
              {req.kind === "STAY" ? (
                <Home className="mr-1 size-3" />
              ) : (
                <Warehouse className="mr-1 size-3" />
              )}
              {req.kind}
            </Badge>
            <Badge className={style.className}>{style.label}</Badge>
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="font-medium">{req.listingTitle}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-3.5" />
            {req.dateLabel}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="size-3.5" />
            {req.priceLabel}
          </span>
        </div>

        {/* Actions for REQUESTED */}
        {req.status === "REQUESTED" && (
          <div className="flex items-center gap-3 pt-1">
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
              onClick={onAccept}
            >
              <CheckCircle2 className="size-4" />
              Accept
            </Button>
            <Button variant="destructive" onClick={onDecline}>
              <XCircle className="size-4" />
              Decline
            </Button>
          </div>
        )}

        {/* Info for ACCEPTED */}
        {req.status === "ACCEPTED" && req.expiresAt && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-amber-600">
              <Clock className="size-3.5" />
              <ExpiryCountdown expiresAt={req.expiresAt} />
            </span>
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              Payment pending
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setLabel(`Expires in ${hours}h ${mins}m`);
    }
    calc();
    const interval = setInterval(calc, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <>{label}</>;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
