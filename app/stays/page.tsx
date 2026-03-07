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

type StayFilter = "electric" | "water" | "sewage" | "gas" | "pullThrough";

const FILTER_OPTIONS: { key: StayFilter; label: string }[] = [
  { key: "electric", label: "⚡ Electric" },
  { key: "water", label: "💧 Water" },
  { key: "sewage", label: "Sewage" },
  { key: "gas", label: "Gas" },
  { key: "pullThrough", label: "Pull-through" },
];

function StaysContent() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination") ?? "";
  const checkIn = searchParams.get("checkIn") ?? undefined;
  const checkOut = searchParams.get("checkOut") ?? undefined;

  const stayListings = useAppStore((s) => s.stayListings);

  const [activeFilters, setActiveFilters] = useState<Set<StayFilter>>(new Set());
  const [sortOrder, setSortOrder] = useState("price-asc");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  function toggleFilter(key: StayFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredListings = useMemo(() => {
    let results = stayListings.filter((l) => l.status === "LIVE");

    if (activeFilters.has("electric")) results = results.filter((l) => l.electric !== "NONE");
    if (activeFilters.has("water")) results = results.filter((l) => l.water);
    if (activeFilters.has("sewage")) results = results.filter((l) => l.sewage);
    if (activeFilters.has("gas")) results = results.filter((l) => l.gas);
    if (activeFilters.has("pullThrough")) results = results.filter((l) => l.pullThrough);

    results.sort((a, b) =>
      sortOrder === "price-asc"
        ? a.nightlyPriceCents - b.nightlyPriceCents
        : b.nightlyPriceCents - a.nightlyPriceCents
    );

    return results;
  }, [stayListings, activeFilters, sortOrder]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Search className="size-5" />
          {destination ? `Stays near ${destination}` : "All Stays"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filteredListings.length} {filteredListings.length === 1 ? "result" : "results"}
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
            No stays found matching your filters
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
          <p className="text-muted-foreground">Loading stays…</p>
        </div>
      }
    >
      <StaysContent />
    </Suspense>
  );
}
