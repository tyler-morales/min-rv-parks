"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { List, Map, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingCard } from "@/components/listing-card";
import { MapView } from "@/components/map-view";
import type { StorageListing } from "@/lib/types";

type StorageFilter = "coveredIndoor" | "access247" | "gated" | "cameras" | "power";

const FILTER_OPTIONS: { key: StorageFilter; label: string }[] = [
  { key: "coveredIndoor", label: "Covered/Indoor" },
  { key: "access247", label: "24/7 Access" },
  { key: "gated", label: "Gated" },
  { key: "cameras", label: "Cameras" },
  { key: "power", label: "Power" },
];

function StorageContent() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination") ?? "";
  const lat = searchParams.get("lat") ?? "";
  const lng = searchParams.get("lng") ?? "";
  const radius = searchParams.get("radius") ?? "25";

  const [listings, setListings] = useState<StorageListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<StorageFilter>>(new Set());
  const [sortOrder, setSortOrder] = useState("price-asc");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const hasLocation = lat !== "" && lng !== "";

  const fetchListings = useCallback(async (filters: Set<StorageFilter>) => {
    if (!hasLocation) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ lat, lng, radius });
      for (const f of filters) {
        params.set(f, "true");
      }
      const res = await fetch(`/api/storage/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, radius, hasLocation]);

  useEffect(() => {
    fetchListings(activeFilters);
  }, [fetchListings, activeFilters]);

  function toggleFilter(key: StorageFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const sortedListings = useMemo(() => {
    const sorted = [...listings];
    sorted.sort((a, b) =>
      sortOrder === "price-asc"
        ? a.monthlyPriceCents - b.monthlyPriceCents
        : b.monthlyPriceCents - a.monthlyPriceCents,
    );
    return sorted;
  }, [listings, sortOrder]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Search className="size-5" />
          {destination ? `Storage near ${destination}` : "All Storage"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading
            ? "Searching…"
            : !hasLocation
              ? "Enter a destination to search"
              : `${sortedListings.length} ${sortedListings.length === 1 ? "result" : "results"}`}
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

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "map" ? (
        <MapView
          listings={sortedListings}
          centerLat={parseFloat(lat)}
          centerLng={parseFloat(lng)}
        />
      ) : sortedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {hasLocation ? "No storage found matching your filters" : "Search for a destination"}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {hasLocation
              ? "Try removing some filters or expanding your search radius."
              : "Use the search bar above to find RV storage near you."}
          </p>
          {hasLocation && (
            <Button variant="outline" onClick={() => setActiveFilters(new Set())}>
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedListings.map((listing) => (
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
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StorageContent />
    </Suspense>
  );
}
