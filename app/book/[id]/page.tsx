"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { StayListing } from "@/lib/types";

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(Math.round(ms / 86_400_000), 0);
}

export default function RequestToBookPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  const [listing, setListing] = useState<StayListing | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.listingType === "STAY") setListing(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          className="mt-4"
          variant="outline"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  const nightlyPrice = listing.nightlyPriceCents;
  const totalCents = nights * nightlyPrice;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing!.id,
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
          message: message || undefined,
          checkIn,
          checkOut,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <CheckCircle className="mx-auto size-16 text-primary" />
        <h1 className="mt-6 text-2xl font-bold">Your request has been sent!</h1>
        <p className="mt-3 text-muted-foreground">
          The host will review your request and respond within 24 hours. If
          accepted, you&apos;ll have 24 hours to complete payment.
        </p>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          className="mt-8"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" data-icon="inline-start" />
        Back
      </Button>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-2xl font-bold">Request to Book</h1>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-0000"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="message">Message to host (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself or share any details the host should know…"
                rows={4}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                "Send Request"
              )}
            </Button>
          </form>
        </div>

        {/* Right — Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            {listing.photos[0] && (
              <div className="relative aspect-[16/10]">
                <Image
                  src={listing.photos[0]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  unoptimized={!listing.photos[0].includes("unsplash")}
                />
              </div>
            )}

            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-base font-semibold leading-snug">{listing.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-5 pt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-medium">{checkIn || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-medium">{checkOut || "—"}</p>
                </div>
              </div>

              {nights > 0 && (
                <p className="text-sm text-muted-foreground">
                  {nights} night{nights !== 1 ? "s" : ""}
                </p>
              )}

              <Separator />

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    {nights} night{nights !== 1 ? "s" : ""} &times;{" "}
                    {formatPrice(nightlyPrice)}/night
                  </span>
                  <span>{formatPrice(totalCents)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(totalCents)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                {listing.host.avatar && (
                  <Image
                    src={listing.host.avatar}
                    alt={listing.host.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium">{listing.host.name}</p>
                  <p className="text-muted-foreground">Host</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
