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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { StorageListing } from "@/lib/types";

export default function RequestToStorePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const moveIn = searchParams.get("moveIn") ?? "";

  const [listing, setListing] = useState<StorageListing | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [months, setMonths] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.listingType === "STORAGE") {
          setListing(data);
          setMonths(data.minimumMonths ?? 1);
        }
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

  const depositCents = listing.depositCents;
  const monthlyCents = listing.monthlyPriceCents;
  const firstPaymentCents = depositCents + monthlyCents;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/storage-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing!.id,
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
          message: message || undefined,
          moveInDate: moveIn,
          months,
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
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-6 text-2xl font-bold">Your request has been sent!</h1>
        <p className="mt-3 text-neutral-600">
          The host will review your storage request and respond within 24 hours.
          If accepted, you&apos;ll have 24 hours to complete your first payment.
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
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-2xl font-bold">Request to Store</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="months">Months requested</Label>
              <Input
                id="months"
                type="number"
                required
                min={listing.minimumMonths}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              />
              {listing.minimumMonths > 1 && (
                <p className="text-xs text-neutral-500">
                  Minimum {listing.minimumMonths} months
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message to host (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the host about your RV and any special requirements…"
                rows={4}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
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

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-snug">{listing.title}</h2>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {listing.storageType.toLowerCase()}
                </Badge>
              </div>

              <div className="text-sm">
                <p className="text-neutral-500">Move-in date</p>
                <p className="font-medium">{moveIn || "—"}</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monthly rate</span>
                  <span>{formatPrice(monthlyCents)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Security deposit</span>
                  <span>{formatPrice(depositCents)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>First payment</span>
                  <span>{formatPrice(firstPaymentCents)}</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Deposit + first month&apos;s rent
                </p>
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
                  <p className="text-neutral-500">Host</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
