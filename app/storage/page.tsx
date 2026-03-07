"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, List, Map, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingCard } from "@/components/listing-card";
import { useAppStore } from "@/lib/store";

type StorageFilter = "coveredIndoor" | "access247" | "gated" | "cameras" | "power";

const FILTER_OPTIONS: { key: StorageFilter; label: string }[] = [
  { key: "coveredIndoor", label: "Covered/Indoor" },
  { key: "access247", label: "24/7 Access" },
  { key: "gated", label: "Gated" },
  { key: "cameras", label: "Cameras" },
  { key: "power", label: "⚡ Power" },
];

function StorageContent() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination") ?? "";

  const storageListings = useAppStore((s) => s.storageListings);

  const [activeFilters, setActiveFilters] = useState<Set<StorageFilter>>(new Set());
  const [sortOrder, setSortOrder] = useState("price-asc");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  function toggleFilter(key: StorageFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredListings = useMemo(() => {
    let results = storageListings.filter((l) => l.status === "LIVE" && l.isAvailable);

    if (activeFilters.has("coveredIndoor")) {
      results = results.filter(
        (l) => l.storageType === "COVERED" || l.storageType === "INDOOR"
      );
    }
    if (activeFilters.has("access247")) results = results.filter((l) => l.access === "24_7");
    if (activeFilters.has("gated"))
      results = results.filter((l) => l.securityFeatures.includes("GATED"));
    if (activeFilters.has("cameras"))
      results = results.filter((l) => l.securityFeatures.includes("CAMERAS"));
    if (activeFilters.has("power")) results = results.filter((l) => l.powerAvailable);

    results.sort((a, b) =>
      sortOrder === "price-asc"
        ? a.monthlyPriceCents - b.monthlyPriceCents
        : b.monthlyPriceCents - a.monthlyPriceCents
    );

    return results;
  }, [storageListings, activeFilters, sortOrder]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Search className="size-5" />
          {destination ? `Storage near ${destination}` : "All Storage"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filteredListings.length} {filteredListings.length === 1 ? "result" : "results"}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar"
          role="group"
          aria-label="Filter storage"
        >
          {FILTER_OPTIONS.map(({ key, label }) => (
            <Button
              key={key}
              variant={activeFilters.has(key) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(key)}
              aria-pressed={activeFilters.has(key)}
              className="shrink-0"
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={sortOrder}
            onValueChange={(val) => {
              if (val) setSortOrder(val);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
            aria-label={viewMode === "list" ? "Switch to map view" : "Switch to list view"}
          >
            {viewMode === "list" ? <Map className="size-4" /> : <List className="size-4" />}
          </Button>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-muted-foreground">Map view coming soon</p>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            No storage found matching your filters
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Try removing some filters to see more results.
          </p>
          <Button variant="outline" onClick={() => setActiveFilters(new Set())}>
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StoragePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading storage…</p>
        </div>
      }
    >
      <StorageContent />
    </Suspense>
  );
}
