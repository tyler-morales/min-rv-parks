"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Clock, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(Math.round(ms / 86_400_000), 0);
}

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setRemaining("Expired");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { remaining, expired };
}

interface RequestData {
  id: string;
  listing_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_price_cents: number;
  status: string;
  expires_at: string | null;
  listings?: { title: string };
}

export default function BookingConfirmPage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [req, setReq] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    fetch(`/api/booking-requests/${requestId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setReq(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requestId]);

  const { remaining, expired } = useCountdown(req?.expires_at ?? null);

  const handlePay = useCallback(async () => {
    if (!requestId) return;
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create checkout session");
        setPaying(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }, [requestId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requestId || !req) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Request not found</h1>
        <p className="mt-2 text-neutral-600">This payment link may be invalid or expired.</p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-4" variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  if (req.status !== "ACCEPTED") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold">
          {req.status === "EXPIRED" ? "Request Expired" : "Payment Not Available"}
        </h1>
        <p className="mt-2 text-neutral-600">
          {req.status === "EXPIRED"
            ? "The 24-hour payment window has passed. Please submit a new request."
            : `This request has status: ${req.status}.`}
        </p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-4" variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  const nights = nightsBetween(req.check_in, req.check_out);
  const nightlyRate = nights > 0 ? Math.round(req.total_price_cents / nights) : 0;
  const title = req.listings?.title ?? "RV Stay";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-bold">Complete Your Payment</h1>

      {!expired && remaining && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Payment window closes in <strong>{remaining}</strong>
          </span>
        </div>
      )}

      {expired && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This request has expired. Please submit a new booking request.
        </div>
      )}

      <Card className="mt-6 p-6 space-y-4">
        <h2 className="font-semibold">{title}</h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-neutral-500">Check-in</p>
            <p className="font-medium">{req.check_in}</p>
          </div>
          <div>
            <p className="text-neutral-500">Check-out</p>
            <p className="font-medium">{req.check_out}</p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-sm">
          <span>
            {nights} night{nights !== 1 ? "s" : ""} &times; {formatPrice(nightlyRate)}/night
          </span>
          <span className="font-semibold">{formatPrice(req.total_price_cents)}</span>
        </div>

        <Separator />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
          onClick={handlePay}
          disabled={paying || expired}
        >
          {paying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {paying ? "Redirecting to Stripe…" : `Pay ${formatPrice(req.total_price_cents)}`}
        </Button>
      </Card>
    </div>
  );
}
