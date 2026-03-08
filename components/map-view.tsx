"use client";

import { useCallback, useMemo, useState } from "react";
import MapGL, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { StayListing, StorageListing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type AnyListing = StayListing | StorageListing;

interface Props {
  listings: AnyListing[];
  centerLat?: number;
  centerLng?: number;
}

function isStay(l: AnyListing): l is StayListing {
  return l.listingType === "STAY";
}

export function MapView({ listings, centerLat, centerLng }: Props) {
  const [selected, setSelected] = useState<AnyListing | null>(null);

  const bounds = useMemo(() => {
    if (listings.length === 0) return null;
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    for (const l of listings) {
      minLat = Math.min(minLat, l.publicLat);
      maxLat = Math.max(maxLat, l.publicLat);
      minLng = Math.min(minLng, l.publicLng);
      maxLng = Math.max(maxLng, l.publicLng);
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [listings]);

  const initialViewState = useMemo(() => {
    if (centerLat && centerLng) {
      return { latitude: centerLat, longitude: centerLng, zoom: 9 };
    }
    if (bounds) {
      return {
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2,
        zoom: 8,
      };
    }
    return { latitude: 39.5, longitude: -98.35, zoom: 4 };
  }, [centerLat, centerLng, bounds]);

  const handleMarkerClick = useCallback((listing: AnyListing) => {
    setSelected(listing);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
        <p className="text-muted-foreground">Map unavailable (missing Mapbox token)</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] overflow-hidden rounded-xl border border-border">
      <MapGL
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {listings.map((listing) => (
          <Marker
            key={listing.id}
            latitude={listing.publicLat}
            longitude={listing.publicLng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(listing);
            }}
          >
            <button
              aria-label={`View ${listing.title}`}
              className="flex items-center gap-1 rounded-full bg-background px-2 py-1 text-xs font-bold text-primary shadow-md ring-1 ring-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MapPin className="size-3" />
              {isStay(listing)
                ? formatPrice(listing.nightlyPriceCents)
                : `${formatPrice(listing.monthlyPriceCents)}/mo`}
            </button>
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={selected.publicLat}
            longitude={selected.publicLng}
            anchor="bottom"
            offset={[0, -36]}
            closeOnClick={false}
            onClose={() => setSelected(null)}
            className="z-50"
            maxWidth="240px"
          >
            <Link
              href={isStay(selected) ? `/stays/${selected.id}` : `/storage/${selected.id}`}
              className="flex flex-col gap-2 p-1 no-underline"
            >
              {selected.photos[0] && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                  <Image
                    src={selected.photos[0]}
                    alt={selected.title}
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                </div>
              )}
              <p className="font-semibold leading-snug text-foreground line-clamp-1">
                {selected.title}
              </p>
              <p className="text-xs text-muted-foreground">Near {selected.nearTown}</p>
              <p className="font-bold text-primary">
                {isStay(selected)
                  ? `${formatPrice(selected.nightlyPriceCents)} / night`
                  : `${formatPrice(selected.monthlyPriceCents)} / month`}
              </p>
            </Link>
          </Popup>
        )}
      </MapGL>
    </div>
  );
}
