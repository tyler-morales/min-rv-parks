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
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/mock-data";

export default function RequestToStorePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const moveIn = searchParams.get("moveIn") ?? "";

  const listing = useAppStore((s) =>
    s.storageListings.find((l) => l.id === params.id)
  );
  const approvedEmails = useAppStore((s) => s.approvedEmails);
  const addStorageRequest = useAppStore((s) => s.addStorageRequest);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [months, setMonths] = useState(listing?.minimumMonths ?? 1);
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

  const depositCents = listing.depositCents;
  const monthlyCents = listing.monthlyPriceCents;
  const firstPaymentCents = depositCents + monthlyCents;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!approvedEmails.includes(email.toLowerCase())) {
      setError("NOT_APPROVED");
      return;
    }

    addStorageRequest({
      id: `sr-${Date.now()}`,
      listingId: listing!.id,
      listing: listing!,
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      message: message || undefined,
      moveInDate: moveIn,
      months,
      depositCents,
      monthlyPriceCents: monthlyCents,
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
          The host will review your storage request and respond within 24 hours.
          If accepted, you&apos;ll have 24 hours to complete your first payment.
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
