"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/mock-data";

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(Math.round(ms / 86_400_000), 0);
}

export default function BookingConfirmPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [paid, setPaid] = useState(false);

  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  const listing = useAppStore((s) =>
    s.stayListings.find((l) => l.id === params.id)
  );

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-4" variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  const totalCents = nights * listing.nightlyPriceCents;

  if (paid) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-6 text-2xl font-bold">Payment Successful!</h1>
        <p className="mt-3 text-neutral-600">
          Your booking is confirmed. The host has been notified.
        </p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-8">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-bold">Complete Your Payment</h1>

      <Card className="mt-8 p-6 space-y-4">
        <h2 className="font-semibold">{listing.title}</h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-neutral-500">Check-in</p>
            <p className="font-medium">{checkIn || "—"}</p>
          </div>
          <div>
            <p className="text-neutral-500">Check-out</p>
            <p className="font-medium">{checkOut || "—"}</p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-sm">
          <span>
            {nights} night{nights !== 1 ? "s" : ""} &times;{" "}
            {formatPrice(listing.nightlyPriceCents)}/night
          </span>
          <span className="font-semibold">{formatPrice(totalCents)}</span>
        </div>

        <Separator />

        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
          onClick={() => setPaid(true)}
        >
          <CreditCard className="h-4 w-4" />
          Pay {formatPrice(totalCents)} with Stripe
        </Button>

        <p className="text-center text-xs text-neutral-500">
          This is a demo. No real payment is processed.
        </p>
      </Card>
    </div>
  );
}
