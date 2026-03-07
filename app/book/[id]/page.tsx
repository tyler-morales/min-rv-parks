"use client";

import { useState, type FormEvent } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/mock-data";

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

  const listing = useAppStore((s) =>
    s.stayListings.find((l) => l.id === params.id)
  );
  const approvedEmails = useAppStore((s) => s.approvedEmails);
  const addBookingRequest = useAppStore((s) => s.addBookingRequest);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  const nightlyPrice = listing.nightlyPriceCents;
  const totalCents = nights * nightlyPrice;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!approvedEmails.includes(email.toLowerCase())) {
      setError("NOT_APPROVED");
      return;
    }

    addBookingRequest({
      id: `br-${Date.now()}`,
      listingId: listing!.id,
      listing: listing!,
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      message: message || undefined,
      checkIn,
      checkOut,
      totalPriceCents: totalCents,
      status: "REQUESTED",
      createdAt: new Date().toISOString().split("T")[0],
    });

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-6 text-2xl font-bold">Your request has been sent!</h1>
        <p className="mt-3 text-neutral-600">
          The host will review your request and respond within 24 hours. If
          accepted, you&apos;ll have 24 hours to complete payment.
        </p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-8">
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
        {/* Left — Form */}
        <div>
          <h1 className="text-2xl font-bold">Request to Book</h1>

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
              <Label htmlFor="message">Message to host (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself or share any details the host should know…"
                rows={4}
              />
            </div>

            {error === "NOT_APPROVED" && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                Your email is not beta-approved. Please{" "}
                <Link href="/apply" className="font-medium underline">
                  apply first
                </Link>
                .
              </div>
            )}

            <p className="text-xs text-neutral-500">
              Only beta-approved guests can submit requests.
            </p>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Send Request
            </Button>
          </form>
        </div>

        {/* Right — Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Image
                src={listing.photos[0]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-5 space-y-4">
              <h2 className="font-semibold leading-snug">{listing.title}</h2>

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

              {nights > 0 && (
                <p className="text-sm text-neutral-600">
                  {nights} night{nights !== 1 ? "s" : ""}
                </p>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
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
                <Image
                  src={listing.host.avatar}
                  alt={listing.host.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
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
