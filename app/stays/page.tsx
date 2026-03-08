"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import type { StayListing } from "@/lib/types";

type StayFilter = "electric" | "water" | "sewage" | "gas" | "pullThrough";

const FILTER_OPTIONS: { key: StayFilter; label: string }[] = [
  { key: "electric", label: "Electric" },
  { key: "water", label: "Water" },
  { key: "sewage", label: "Sewage" },
  { key: "gas", label: "Gas" },
  { key: "pullThrough", label: "Pull-through" },
];

function StaysContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination") ?? "";
  const lat = searchParams.get("lat") ?? "";
  const lng = searchParams.get("lng") ?? "";
  const radius = searchParams.get("radius") ?? "25";
  const checkIn = searchParams.get("checkIn") ?? undefined;
  const checkOut = searchParams.get("checkOut") ?? undefined;

  const [listings, setListings] = useState<StayListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<StayFilter>>(new Set());
  const [sortOrder, setSortOrder] = useState("price-asc");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const hasLocation = lat !== "" && lng !== "";

  const fetchListings = useCallback(async (filters: Set<StayFilter>) => {
    if (!hasLocation) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ lat, lng, radius });
      if (checkIn) params.set("checkIn", checkIn);
      if (checkOut) params.set("checkOut", checkOut);
      for (const f of filters) {
        params.set(f, "true");
      }
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, radius, checkIn, checkOut, hasLocation]);

  useEffect(() => {
    fetchListings(activeFilters);
  }, [fetchListings, activeFilters]);

  function toggleFilter(key: StayFilter) {
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
        ? a.nightlyPriceCents - b.nightlyPriceCents
        : b.nightlyPriceCents - a.nightlyPriceCents,
    );
    return sorted;
  }, [listings, sortOrder]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Search className="size-5" />
          {destination ? `Stays near ${destination}` : "All Stays"}
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
          aria-label="Filter stays"
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
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <Search className="mb-3 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {hasLocation ? "No stays found" : "Search for a destination"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasLocation
              ? "Try clearing filters, expanding the radius, or searching without dates. If you’re a host testing your own listing, it only appears when its status is Live (approved by an admin)—check your dashboard."
              : "Use the search bar above to find RV stays near you."}
          </p>
          {hasLocation && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveFilters(new Set())}
              >
                Clear filters
              </Button>
              {(checkIn || checkOut) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("checkIn");
                    params.delete("checkOut");
                    router.replace(`/stays?${params.toString()}`, { scroll: false });
                  }}
                >
                  Try without dates
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StaysPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StaysContent />
    </Suspense>
  );
}
