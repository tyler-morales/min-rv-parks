"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { formatPrice, formatPriceDecimal } from "@/lib/utils";
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
  Loader2,
  MessageSquare,
} from "lucide-react";

type FilterTab = "all" | "stays" | "storage" | "pending" | "accepted" | "declined";

interface NormalizedRequest {
  id: string;
  kind: "STAY" | "STORAGE";
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestMessage: string | null;
  listingTitle: string;
  status: string;
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
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<NormalizedRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/host/login");
  }, [user, authLoading, router]);

  const loadRequests = useCallback(async () => {
    const res = await fetch("/api/host/requests");
    if (!res.ok) return;
    const data = await res.json();

    const bookings: NormalizedRequest[] = (data.bookingRequests ?? []).map(
      (r: Record<string, string | number>) => ({
        id: r.id,
        kind: "STAY" as const,
        guestName: r.guest_name,
        guestEmail: r.guest_email,
        guestPhone: r.guest_phone,
        guestMessage: (r.message as string) ?? null,
        listingTitle: r.listing_title,
        status: r.status,
        dateLabel: `${fmtDate(r.check_in as string)} – ${fmtDate(r.check_out as string)}`,
        priceLabel: `Total: ${formatPriceDecimal(r.total_price_cents as number)}`,
        expiresAt: r.expires_at as string | undefined,
        createdAt: r.created_at as string,
      }),
    );

    const storage: NormalizedRequest[] = (data.storageRequests ?? []).map(
      (r: Record<string, string | number>) => ({
        id: r.id,
        kind: "STORAGE" as const,
        guestName: r.guest_name,
        guestEmail: r.guest_email,
        guestPhone: r.guest_phone,
        guestMessage: (r.message as string) ?? null,
        listingTitle: r.listing_title,
        status: r.status,
        dateLabel: `Move-in ${fmtDate(r.move_in_date as string)} · ${r.months} month${(r.months as number) !== 1 ? "s" : ""}`,
        priceLabel: `${formatPrice(r.monthly_price_cents as number)}/mo + ${formatPrice(r.deposit_cents as number)} deposit`,
        expiresAt: r.expires_at as string | undefined,
        createdAt: r.created_at as string,
      }),
    );

    setRequests(
      [...bookings, ...storage].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    loadRequests().finally(() => setDataLoading(false));
  }, [user, loadRequests]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "stays":
        return requests.filter((r) => r.kind === "STAY");
      case "storage":
        return requests.filter((r) => r.kind === "STORAGE");
      case "pending":
        return requests.filter((r) => r.status === "REQUESTED");
      case "accepted":
        return requests.filter((r) => r.status === "ACCEPTED");
      case "declined":
        return requests.filter((r) => r.status === "DECLINED");
      default:
        return requests;
    }
  }, [requests, activeTab]);

  async function handleAction(req: NormalizedRequest, action: "accept" | "decline") {
    setActionLoading(`${req.id}-${action}`);
    setEmailNotice(null);
    const prefix = req.kind === "STAY" ? "booking" : "storage";
    try {
      const res = await fetch(`/api/host/${prefix}-requests/${req.id}/${action}`, {
        method: "POST",
      });
      const data = res.ok ? await res.json().catch(() => ({})) : null;
      if (res.ok) {
        await loadRequests();
        if (data?.emailSent === false) {
          setEmailNotice(
            "Request updated. Guest was not notified by email — set RESEND_API_KEY in your environment to enable notifications.",
          );
          setTimeout(() => setEmailNotice(null), 8000);
        }
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="size-6 text-emerald-600" />
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
      </div>

      {emailNotice && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200" role="alert">
          {emailNotice}
        </p>
      )}

      {dataLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
                    actionLoading={actionLoading}
                    onAccept={() => handleAction(req, "accept")}
                    onDecline={() => handleAction(req, "decline")}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function RequestCard({
  req,
  actionLoading,
  onAccept,
  onDecline,
}: {
  req: NormalizedRequest;
  actionLoading: string | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const style = STATUS_STYLES[req.status] ?? STATUS_STYLES.EXPIRED;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
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

        {(req.guestMessage ?? "").trim() ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground" id={`request-${req.id}-message-label`}>
              <MessageSquare className="size-3.5" aria-hidden />
              Message from guest
            </span>
            <p className="mt-1 whitespace-pre-wrap text-foreground" aria-labelledby={`request-${req.id}-message-label`}>
              {req.guestMessage}
            </p>
          </div>
        ) : null}

        <Separator />

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

        {req.status === "REQUESTED" && (
          <div className="flex items-center gap-3 pt-1">
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
              disabled={actionLoading === `${req.id}-accept`}
              onClick={onAccept}
            >
              {actionLoading === `${req.id}-accept` ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Accept
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading === `${req.id}-decline`}
              onClick={onDecline}
            >
              {actionLoading === `${req.id}-decline` ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Decline
            </Button>
          </div>
        )}

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
  return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
