"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Upload,
  ImageIcon,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import type {
  ListingType,
  ElectricType,
  StorageType,
  AccessType,
  SecurityFeature,
} from "@/lib/types";

const STEP_LABELS = [
  "Type",
  "Basics",
  "RV Fit & Features",
  "Photos",
  "Pricing & Rules",
  "Availability",
  "Review & Submit",
];

interface WizardState {
  listingType: ListingType | null;
  title: string;
  description: string;
  nearTown: string;
  maxRigLength: number;
  slideOutsAllowed: boolean;
  pullThrough: boolean;
  electric: ElectricType;
  water: boolean;
  sewage: boolean;
  gas: boolean;
  storageType: StorageType;
  access: AccessType;
  securityFeatures: SecurityFeature[];
  powerAvailable: boolean;
  nightlyPriceCents: number;
  minStayNights: number;
  maxStayNights: number;
  monthlyPriceCents: number;
  depositCents: number;
  minimumMonths: number;
  blockedDates: string[];
  isAvailable: boolean;
  photoUrls: string[];
  photoFiles: File[];
}

const INITIAL_STATE: WizardState = {
  listingType: null,
  title: "",
  description: "",
  nearTown: "",
  maxRigLength: 40,
  slideOutsAllowed: false,
  pullThrough: false,
  electric: "NONE",
  water: false,
  sewage: false,
  gas: false,
  storageType: "OUTDOOR",
  access: "24_7",
  securityFeatures: [],
  powerAvailable: false,
  nightlyPriceCents: 5000,
  minStayNights: 1,
  maxStayNights: 30,
  monthlyPriceCents: 10000,
  depositCents: 5000,
  minimumMonths: 1,
  blockedDates: [],
  isAvailable: true,
  photoUrls: [],
  photoFiles: [],
};

export default function NewListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(INITIAL_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/host/login");
  }, [user, authLoading, router]);

  function update(partial: Partial<WizardState>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (step === 1 && !data.listingType) errs.push("Select a listing type.");
    if (step === 2) {
      if (!data.title.trim()) errs.push("Title is required.");
      if (!data.description.trim()) errs.push("Description is required.");
      if (!data.nearTown.trim()) errs.push("Location is required.");
    }
    if (step === 3 && data.maxRigLength < 10)
      errs.push("Max rig length must be at least 10 ft.");
    if (step === 4 && data.photoUrls.length < 5)
      errs.push("Minimum 5 photos required.");
    if (step === 5) {
      if (data.listingType === "STAY" && data.nightlyPriceCents < 100)
        errs.push("Nightly price must be at least $1.");
      if (data.listingType === "STORAGE" && data.monthlyPriceCents < 100)
        errs.push("Monthly price must be at least $1.");
    }
    return errs;
  }

  function handleNext() {
    const v = validate();
    if (v.length) {
      setErrors(v);
      return;
    }
    setErrors([]);
    setStep((s) => Math.min(s + 1, 7));
  }

  function handleBack() {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    setSubmitError("");
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        listingType: data.listingType,
        title: data.title,
        description: data.description,
        nearTown: data.nearTown,
        maxRigLength: data.maxRigLength,
        slideOutsAllowed: data.slideOutsAllowed,
        pullThrough: data.pullThrough,
        electric: data.electric,
        water: data.water,
        sewage: data.sewage,
        gas: data.gas,
        storageType: data.storageType,
        access: data.access,
        securityFeatures: data.securityFeatures,
        powerAvailable: data.powerAvailable,
        noLivingOnSite: true,
        nightlyPriceCents: data.nightlyPriceCents,
        minStayNights: data.minStayNights,
        maxStayNights: data.maxStayNights,
        monthlyPriceCents: data.monthlyPriceCents,
        depositCents: data.depositCents,
        minimumMonths: data.minimumMonths,
        blockedDates: data.blockedDates,
        isAvailable: data.isAvailable,
      };
      const createRes = await fetch("/api/host/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create listing");
      }
      const { id } = await createRes.json();
      for (const file of data.photoFiles) {
        const form = new FormData();
        form.set("file", file);
        const photoRes = await fetch(`/api/host/listings/${id}/photos`, {
          method: "POST",
          body: form,
        });
        if (!photoRes.ok) {
          const err = await photoRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to upload photo");
        }
      }
      const submitRes = await fetch(`/api/host/listings/${id}/submit`, {
        method: "POST",
      });
      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to submit for review");
      }
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
          <PartyPopper className="size-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Listing Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Your listing has been submitted for review. We&apos;ll notify you once
          it&apos;s approved.
        </p>
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
          onClick={() => router.push("/host/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Create New Listing
      </h1>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={
                i + 1 === step
                  ? "font-semibold text-emerald-600"
                  : i + 1 < step
                    ? "text-emerald-600/70"
                    : ""
              }
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </span>
          ))}
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
        >
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[350px]">
        {step === 1 && <StepType data={data} update={update} onNext={handleNext} />}
        {step === 2 && <StepBasics data={data} update={update} />}
        {step === 3 && <StepFeatures data={data} update={update} />}
        {step === 4 && <StepPhotos data={data} update={update} />}
        {step === 5 && <StepPricing data={data} update={update} />}
        {step === 6 && <StepAvailability data={data} update={update} />}
        {step === 7 && (
          <StepReview
            data={data}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </div>

      {/* Navigation */}
      {step > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {step < 7 ? (
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
              onClick={handleNext}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Step 1: Type ────────────────────────────────────────────── */

function StepType({
  data,
  update,
  onNext,
}: {
  data: WizardState;
  update: (p: Partial<WizardState>) => void;
  onNext: () => void;
}) {
  function select(type: ListingType) {
    update({ listingType: type });
    setTimeout(onNext, 150);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">What are you listing?</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose the type of listing you want to create.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            {
              type: "STAY" as ListingType,
              icon: Home,
              title: "Nightly Stay",
              desc: "A pad or spot on your property for guests to park and stay overnight.",
            },
            {
              type: "STORAGE" as ListingType,
              icon: Warehouse,
              title: "RV Storage",
              desc: "A secure place for RV owners to store their rig when not in use.",
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => select(opt.type)}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-8 text-center transition-all hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              data.listingType === opt.type
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-border"
            }`}
          >
            <opt.icon className="size-10 text-emerald-600" />
            <span className="text-lg font-semibold">{opt.title}</span>
            <span className="text-sm text-muted-foreground">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: Basics ──────────────────────────────────────────── */

function StepBasics({
  data,
  update,
}: {
  data: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Basic Information</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Shaded Pad at Hill Country Ranch"
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your listing, what makes it special, what guests can expect..."
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nearTown">Near Town</Label>
        <Input
          id="nearTown"
          placeholder="e.g. Fredericksburg, TX"
          value={data.nearTown}
          onChange={(e) => update({ nearTown: e.target.value })}
        />
      </div>
    </div>
  );
}

/* ── Step 3: RV Fit & Features ───────────────────────────────── */

function StepFeatures({
  data,
  update,
}: {
  data: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  function toggleSecurity(feat: SecurityFeature) {
    const next = data.securityFeatures.includes(feat)
      ? data.securityFeatures.filter((f) => f !== feat)
      : [...data.securityFeatures, feat];
    update({ securityFeatures: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">RV Fit & Features</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="maxRig">Max Rig Length (ft)</Label>
        <Input
          id="maxRig"
          type="number"
          min={10}
          max={100}
          value={data.maxRigLength}
          onChange={(e) => update({ maxRigLength: Number(e.target.value) })}
        />
      </div>

      {data.listingType === "STAY" ? (
        <>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={data.slideOutsAllowed}
              onCheckedChange={(v) =>
                update({ slideOutsAllowed: v === true })
              }
              id="slideouts"
            />
            <Label htmlFor="slideouts">Slide-outs allowed</Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={data.pullThrough}
              onCheckedChange={(v) => update({ pullThrough: v === true })}
              id="pullthrough"
            />
            <Label htmlFor="pullthrough">Pull-through</Label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Electric</Label>
            <Select
              value={data.electric}
              onValueChange={(v) => update({ electric: v as ElectricType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select amp service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="15">15 Amp</SelectItem>
                <SelectItem value="30">30 Amp</SelectItem>
                <SelectItem value="50">50 Amp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            {(["water", "sewage", "gas"] as const).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  checked={data[key]}
                  onCheckedChange={(v) => update({ [key]: v === true })}
                  id={key}
                />
                <Label htmlFor={key} className="capitalize">
                  {key}
                </Label>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label>Storage Type</Label>
            <Select
              value={data.storageType}
              onValueChange={(v) => update({ storageType: v as StorageType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                <SelectItem value="COVERED">Covered</SelectItem>
                <SelectItem value="INDOOR">Indoor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Access</Label>
            <Select
              value={data.access}
              onValueChange={(v) => update({ access: v as AccessType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24_7">24/7</SelectItem>
                <SelectItem value="DAYTIME_ONLY">Daytime Only</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              Security Features
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["GATED", "Gated"],
                  ["CAMERAS", "Cameras"],
                  ["LIGHTING", "Lighting"],
                  ["ON_SITE_HOST", "On-site Host"],
                ] as [SecurityFeature, string][]
              ).map(([val, label]) => (
                <div key={val} className="flex items-center gap-3">
                  <Checkbox
                    checked={data.securityFeatures.includes(val)}
                    onCheckedChange={() => toggleSecurity(val)}
                    id={`sec-${val}`}
                  />
                  <Label htmlFor={`sec-${val}`}>{label}</Label>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={data.powerAvailable}
              onCheckedChange={(v) =>
                update({ powerAvailable: v === true })
              }
              id="power"
            />
            <Label htmlFor="power">Power available</Label>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Step 4: Photos ──────────────────────────────────────────── */

function StepPhotos({
  data,
  update,
}: {
  data: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const count = data.photoUrls.length;
  const placeholders = Array.from({ length: Math.max(5, count) });

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    const newFiles = [...data.photoFiles, ...Array.from(files)].slice(0, 10);
    const newUrls = [...data.photoUrls, ...urls].slice(0, 10);
    update({ photoUrls: newUrls, photoFiles: newFiles });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Photos</h2>
      <p className="text-sm text-muted-foreground">
        Minimum 5 photos required.{" "}
        <span className="font-medium text-emerald-600">{count} / 5 uploaded</span>
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="sr-only"
        aria-label="Choose photos"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleZoneClick}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 p-10 text-center transition-colors hover:border-emerald-600/50 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:ring-offset-2 cursor-pointer"
        role="button"
        aria-label="Add photos — drag and drop or click to browse"
      >
        <Upload className="size-10 text-muted-foreground" />
        <p className="font-medium">Drag & drop photos here</p>
        <p className="text-sm text-muted-foreground">
          or click to browse — JPG, PNG up to 10MB
        </p>
      </button>

      <div className="grid grid-cols-5 gap-3">
        {placeholders.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30"
          >
            {data.photoUrls[i] ? (
              <img
                src={data.photoUrls[i]}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step 5: Pricing & Rules ─────────────────────────────────── */

function StepPricing({
  data,
  update,
}: {
  data: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Pricing & Rules</h2>

      {data.listingType === "STAY" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nightly">Nightly Price ($)</Label>
            <Input
              id="nightly"
              type="number"
              min={1}
              step={1}
              value={data.nightlyPriceCents / 100}
              onChange={(e) =>
                update({ nightlyPriceCents: Math.round(Number(e.target.value) * 100) })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minNights">Min Stay (nights)</Label>
              <Input
                id="minNights"
                type="number"
                min={1}
                value={data.minStayNights}
                onChange={(e) =>
                  update({ minStayNights: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maxNights">Max Stay (nights)</Label>
              <Input
                id="maxNights"
                type="number"
                min={1}
                value={data.maxStayNights}
                onChange={(e) =>
                  update({ maxStayNights: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monthly">Monthly Price ($)</Label>
            <Input
              id="monthly"
              type="number"
              min={1}
              step={1}
              value={data.monthlyPriceCents / 100}
              onChange={(e) =>
                update({ monthlyPriceCents: Math.round(Number(e.target.value) * 100) })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deposit">Security Deposit ($)</Label>
              <Input
                id="deposit"
                type="number"
                min={0}
                step={1}
                value={data.depositCents / 100}
                onChange={(e) =>
                  update({ depositCents: Math.round(Number(e.target.value) * 100) })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minMonths">Minimum Months</Label>
              <Input
                id="minMonths"
                type="number"
                min={1}
                value={data.minimumMonths}
                onChange={(e) =>
                  update({ minimumMonths: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Step 6: Availability ────────────────────────────────────── */

function StepAvailability({
  data,
  update,
}: {
  data: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  if (data.listingType === "STORAGE") {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">Availability</h2>
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <Switch
            checked={data.isAvailable}
            onCheckedChange={(v) => update({ isAvailable: v === true })}
            id="available-toggle"
          />
          <Label htmlFor="available-toggle" className="text-base">
            Available for storage
          </Label>
        </div>
      </div>
    );
  }

  const [calendarBaseOffset, setCalendarBaseOffset] = useState(0);
  const maxOffset = 24;
  const canGoPrev = calendarBaseOffset > 0;
  const canGoNext = calendarBaseOffset + 2 <= maxOffset;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Availability</h2>
      <p className="text-sm text-muted-foreground">
        Click dates to block/unblock them. Blocked dates appear in red.
      </p>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoPrev}
            onClick={() => setCalendarBaseOffset((o) => Math.max(0, o - 1))}
            aria-label="Previous months"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="min-w-[8rem] text-center text-sm text-muted-foreground" aria-live="polite">
            {calendarBaseOffset === 0
              ? "Current & next month"
              : `${calendarBaseOffset + 1}–${calendarBaseOffset + 2} months ahead`}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoNext}
            onClick={() =>
              setCalendarBaseOffset((o) => Math.min(maxOffset - 2, o + 1))
            }
            aria-label="Next months"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <MiniCalendar
            monthOffset={calendarBaseOffset}
            blocked={data.blockedDates}
            onToggle={(date) => {
              const next = data.blockedDates.includes(date)
                ? data.blockedDates.filter((d) => d !== date)
                : [...data.blockedDates, date];
              update({ blockedDates: next });
            }}
          />
          <MiniCalendar
            monthOffset={calendarBaseOffset + 1}
            blocked={data.blockedDates}
            onToggle={(date) => {
              const next = data.blockedDates.includes(date)
                ? data.blockedDates.filter((d) => d !== date)
                : [...data.blockedDates, date];
              update({ blockedDates: next });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({
  monthOffset,
  blocked,
  onToggle,
}: {
  monthOffset: number;
  blocked: string[];
  onToggle: (date: string) => void;
}) {
  const now = new Date();
  const totalMonths = now.getFullYear() * 12 + now.getMonth() + monthOffset;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [
    ...Array.from<null>({ length: firstDay }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold">{monthName}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d} className="py-1 font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isBlocked = blocked.includes(dateStr);
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onToggle(dateStr)}
              aria-label={`${isBlocked ? "Unblock" : "Block"} ${dateStr}`}
              className={`rounded-md py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isBlocked
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step 7: Review & Submit ─────────────────────────────────── */

function StepReview({
  data,
  onSubmit,
  submitting,
  submitError,
}: {
  data: WizardState;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string;
}) {
  const rows: [string, string][] = [
    ["Type", data.listingType === "STAY" ? "Nightly Stay" : "RV Storage"],
    ["Title", data.title],
    ["Location", data.nearTown],
    ["Max Rig Length", `${data.maxRigLength} ft`],
  ];

  if (data.listingType === "STAY") {
    rows.push(
      ["Electric", data.electric === "NONE" ? "None" : `${data.electric} Amp`],
      ["Pull-through", data.pullThrough ? "Yes" : "No"],
      ["Slide-outs", data.slideOutsAllowed ? "Yes" : "No"],
      [
        "Hookups",
        [data.water && "Water", data.sewage && "Sewage", data.gas && "Gas"]
          .filter(Boolean)
          .join(", ") || "None",
      ],
      ["Nightly Price", `$${(data.nightlyPriceCents / 100).toFixed(0)}`],
      ["Stay Range", `${data.minStayNights}–${data.maxStayNights} nights`],
      ["Blocked Dates", `${data.blockedDates.length} date(s)`],
    );
  } else {
    rows.push(
      ["Storage Type", data.storageType],
      ["Access", data.access.replace("_", "/")],
      [
        "Security",
        data.securityFeatures.join(", ") || "None",
      ],
      ["Power", data.powerAvailable ? "Yes" : "No"],
      ["Monthly Price", `$${(data.monthlyPriceCents / 100).toFixed(0)}`],
      ["Deposit", `$${(data.depositCents / 100).toFixed(0)}`],
      ["Min Months", String(data.minimumMonths)],
      ["Available", data.isAvailable ? "Yes" : "No"],
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Review Your Listing</h2>
      <Card>
        <CardContent className="divide-y">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Photos: {data.photoUrls.length} uploaded
        </p>
        <p className="text-sm text-muted-foreground">
          Description: {data.description.slice(0, 100)}
          {data.description.length > 100 && "..."}
        </p>
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}

      <Button
        className="h-11 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
        onClick={onSubmit}
        disabled={submitting}
      >
        <CheckCircle2 className="size-4" />
        {submitting ? "Submitting…" : "Submit for Review"}
      </Button>
    </div>
  );
}
