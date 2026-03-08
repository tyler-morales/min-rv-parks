"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { GeocoderInput } from "@/components/geocoder-input";
import type { Listing, StayListing, StorageListing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function isStay(listing: Listing): listing is StayListing {
  return listing.listingType === "STAY";
}

export default function HostListingEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nearTown, setNearTown] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [nightlyPriceCents, setNightlyPriceCents] = useState(0);
  const [minStayNights, setMinStayNights] = useState(1);
  const [maxStayNights, setMaxStayNights] = useState(30);
  const [monthlyPriceCents, setMonthlyPriceCents] = useState(0);
  const [depositCents, setDepositCents] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [photoDeleting, setPhotoDeleting] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchListing = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/host/listings/${id}`);
    if (!res.ok) {
      setListing(null);
      return;
    }
    const data = await res.json();
    setListing(data);
    setTitle(data.title ?? "");
    setDescription(data.description ?? "");
    setNearTown(data.nearTown ?? "");
    const hasValidCoords =
      typeof data.lat === "number" &&
      typeof data.lng === "number" &&
      !(data.lat === 0 && data.lng === 0);
    setLat(hasValidCoords ? data.lat : null);
    setLng(hasValidCoords ? data.lng : null);
    if (data.listingType === "STAY") {
      setNightlyPriceCents(data.nightlyPriceCents ?? 0);
      setMinStayNights(data.minStayNights ?? 1);
      setMaxStayNights(data.maxStayNights ?? 30);
    } else {
      setMonthlyPriceCents(data.monthlyPriceCents ?? 0);
      setDepositCents(data.depositCents ?? 0);
      setIsAvailable(data.isAvailable !== false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchListing().finally(() => setLoading(false));
  }, [user, fetchListing]);

  async function handleDeletePhoto(photoId: string) {
    if (!id) return;
    setPhotoError("");
    setPhotoDeleting(photoId);
    try {
      const res = await fetch(`/api/host/listings/${id}/photos?photoId=${encodeURIComponent(photoId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to delete photo");
      }
      await fetchListing();
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Failed to delete photo");
    } finally {
      setPhotoDeleting(null);
    }
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!id || !files?.length) return;
    e.target.value = "";
    setPhotoError("");
    setPhotoUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/host/listings/${id}/photos`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "Failed to upload photo");
        }
      }
      await fetchListing();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !listing) return;
    if (lat == null || lng == null) {
      setError("Please select a location from the search so guests can find your listing.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        nearTown: nearTown.trim(),
        lat,
        lng,
      };
      if (listing.listingType === "STAY") {
        payload.nightlyPriceCents = nightlyPriceCents;
        payload.minStayNights = minStayNights;
        payload.maxStayNights = maxStayNights;
      } else {
        payload.monthlyPriceCents = monthlyPriceCents;
        payload.depositCents = depositCents;
        payload.isAvailable = isAvailable;
      }
      const res = await fetch(`/api/host/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to update");
      }
      router.push(`/host/listings/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link
        href={id ? `/host/listings/${id}` : "/host/dashboard"}
        className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to listing
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-nearTown">Location (required for search)</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Search and select a city or area. Guests find listings by location.
              </p>
              <GeocoderInput
                value={nearTown}
                onChange={(text) => setNearTown(text)}
                onSelect={(result) => {
                  setNearTown(result.label);
                  setLat(result.lat);
                  setLng(result.lng);
                }}
                placeholder="e.g. Chicago, IL or Fredericksburg, TX"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Photos</Label>
              <p className="text-xs text-muted-foreground">
                Minimum 5 photos required. You have {listing.photos.length}.
              </p>
              {photoError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {photoError}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {listing.photos.map((url, i) => {
                  const photoId = listing.photoIds?.[i];
                  return (
                    <div
                      key={photoId ?? url}
                      className="relative aspect-square overflow-hidden rounded-lg border border-muted bg-muted/30"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={!url.includes("unsplash")}
                        sizes="(max-width:640px) 50vw, 20vw"
                      />
                      {photoId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 size-8 shrink-0 rounded-full bg-white/95 text-red-600 shadow-md ring-1 ring-black/10 hover:bg-white hover:text-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent dark:bg-neutral-900/95 dark:text-red-400 dark:ring-white/20 dark:hover:bg-neutral-800"
                          aria-label={`Remove photo ${i + 1}`}
                          disabled={photoDeleting === photoId}
                          onClick={() => handleDeletePhoto(photoId)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="sr-only"
                aria-label="Add photos"
                onChange={handleAddPhotos}
              />
              <Button
                type="button"
                variant="outline"
                disabled={photoUploading || (listing.photos.length >= 10)}
                onClick={() => photoInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="size-4" />
                {photoUploading ? "Uploading…" : "Add photos"}
              </Button>
            </div>

            {isStay(listing) && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-nightlyPriceCents">Nightly price ($)</Label>
                  <Input
                    id="edit-nightlyPriceCents"
                    type="number"
                    min={0}
                    step={1}
                    value={nightlyPriceCents / 100}
                    onChange={(e) => setNightlyPriceCents(Math.round((Number(e.target.value) || 0) * 100))}
                  />
                  <p className="text-xs text-muted-foreground">e.g. 50 = $50.00</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-minStayNights">Min stay (nights)</Label>
                    <Input
                      id="edit-minStayNights"
                      type="number"
                      min={1}
                      value={minStayNights}
                      onChange={(e) => setMinStayNights(Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-maxStayNights">Max stay (nights)</Label>
                    <Input
                      id="edit-maxStayNights"
                      type="number"
                      min={1}
                      value={maxStayNights}
                      onChange={(e) => setMaxStayNights(Number(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </>
            )}

            {listing.listingType === "STORAGE" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-monthlyPriceCents">Monthly price (cents)</Label>
                  <Input
                    id="edit-monthlyPriceCents"
                    type="number"
                    min={0}
                    step={100}
                    value={monthlyPriceCents}
                    onChange={(e) => setMonthlyPriceCents(Number(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">e.g. 10000 = $100.00</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-depositCents">Deposit (cents)</Label>
                  <Input
                    id="edit-depositCents"
                    type="number"
                    min={0}
                    step={100}
                    value={depositCents}
                    onChange={(e) => setDepositCents(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isAvailable"
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                  />
                  <Label htmlFor="edit-isAvailable">Available for new storage requests</Label>
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={id ? `/host/listings/${id}` : "/host/dashboard"}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
