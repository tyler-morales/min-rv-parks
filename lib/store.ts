"use client";

import { create } from "zustand";
import type { SearchFilters } from "./types";

interface AppState {
  activeTab: "stays" | "storage";
  setActiveTab: (tab: "stays" | "storage") => void;

  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {
  destination: "",
  radius: 25,
  electric: false,
  water: false,
  sewage: false,
  gas: false,
  pullThrough: false,
  coveredIndoor: false,
  access247: false,
  gated: false,
  cameras: false,
  powerAvailable: false,
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: "stays",
  setActiveTab: (tab) => set({ activeTab: tab }),

  searchFilters: defaultFilters,
  setSearchFilters: (filters) =>
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    })),
  resetFilters: () => set({ searchFilters: defaultFilters }),
}));
