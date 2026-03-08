"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

export interface GeocoderResult {
  label: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocoderResult) => void;
  placeholder?: string;
  className?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

interface MapboxFeature {
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export function GeocoderInput({
  value,
  onChange,
  onSelect,
  placeholder = "Where are you headed?",
  className = "",
}: Props) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const url = `${GEOCODE_URL}/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&types=place,locality,neighborhood,address&limit=5&country=us`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      setSuggestions(json.features ?? []);
      setOpen(true);
      setActiveIdx(-1);
    } catch {
      /* network errors silently ignored */
    }
  }, []);

  function handleInputChange(text: string) {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  }

  function handleSelect(feature: MapboxFeature) {
    const label = feature.place_name;
    onChange(label);
    onSelect({
      label,
      lat: feature.center[1],
      lng: feature.center[0],
    });
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="geocoder-listbox"
        aria-activedescendant={activeIdx >= 0 ? `geo-option-${activeIdx}` : undefined}
      />
      {open && suggestions.length > 0 && (
        <ul
          id="geocoder-listbox"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-background shadow-lg"
        >
          {suggestions.map((feature, i) => (
            <li
              key={feature.place_name + i}
              id={`geo-option-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground ${
                i === activeIdx ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
              onMouseDown={() => handleSelect(feature)}
            >
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{feature.place_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
