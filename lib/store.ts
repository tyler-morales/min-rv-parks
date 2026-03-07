"use client";

import { create } from "zustand";
import type {
  SearchFilters,
  BookingRequest,
  StorageRequest,
  BetaApplication,
  StayListing,
  StorageListing,
  RequestStatus,
  ApplicationStatus,
  ListingStatus,
} from "./types";
import {
  stayListings as initialStays,
  storageListings as initialStorage,
  bookingRequests as initialBookingRequests,
  storageRequests as initialStorageRequests,
  betaApplications as initialApplications,
  approvedEmails as initialApprovedEmails,
} from "./mock-data";

interface AppState {
  activeTab: "stays" | "storage";
  setActiveTab: (tab: "stays" | "storage") => void;

  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;

  // Auth
  isHostLoggedIn: boolean;
  hostId: string | null;
  loginAsHost: (email: string) => void;
  logoutHost: () => void;

  isAdmin: boolean;
  loginAsAdmin: () => void;

  // Listings (mutable for host/admin flows)
  stayListings: StayListing[];
  storageListings: StorageListing[];
  updateListingStatus: (id: string, status: ListingStatus) => void;
  toggleVerified: (id: string) => void;

  // Requests
  bookingRequests: BookingRequest[];
  storageRequests: StorageRequest[];
  addBookingRequest: (req: BookingRequest) => void;
  addStorageRequest: (req: StorageRequest) => void;
  updateBookingRequestStatus: (id: string, status: RequestStatus) => void;
  updateStorageRequestStatus: (id: string, status: RequestStatus) => void;

  // Beta applications
  betaApplications: BetaApplication[];
  approvedEmails: string[];
  addBetaApplication: (app: BetaApplication) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
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

  isHostLoggedIn: false,
  hostId: null,
  loginAsHost: (email: string) => {
    const hostMap: Record<string, string> = {
      "jim@hillcountryranch.com": "h1",
      "maria@gulfcoastrv.com": "h2",
      "dave@arizonarv.com": "h3",
      "rachel@coloradorv.com": "h4",
      "tom@floridakeys.com": "h5",
    };
    const hostId = hostMap[email];
    if (hostId) {
      set({ isHostLoggedIn: true, hostId });
    }
  },
  logoutHost: () => set({ isHostLoggedIn: false, hostId: null }),

  isAdmin: false,
  loginAsAdmin: () => set({ isAdmin: true }),

  stayListings: initialStays,
  storageListings: initialStorage,
  updateListingStatus: (id, status) =>
    set((state) => ({
      stayListings: state.stayListings.map((l) =>
        l.id === id ? { ...l, status } : l
      ),
      storageListings: state.storageListings.map((l) =>
        l.id === id ? { ...l, status } : l
      ),
    })),
  toggleVerified: (id) =>
    set((state) => ({
      stayListings: state.stayListings.map((l) =>
        l.id === id ? { ...l, verified: !l.verified } : l
      ),
      storageListings: state.storageListings.map((l) =>
        l.id === id ? { ...l, verified: !l.verified } : l
      ),
    })),

  bookingRequests: initialBookingRequests,
  storageRequests: initialStorageRequests,
  addBookingRequest: (req) =>
    set((state) => ({ bookingRequests: [...state.bookingRequests, req] })),
  addStorageRequest: (req) =>
    set((state) => ({ storageRequests: [...state.storageRequests, req] })),
  updateBookingRequestStatus: (id, status) =>
    set((state) => ({
      bookingRequests: state.bookingRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              expiresAt:
                status === "ACCEPTED"
                  ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                  : r.expiresAt,
            }
          : r
      ),
    })),
  updateStorageRequestStatus: (id, status) =>
    set((state) => ({
      storageRequests: state.storageRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              expiresAt:
                status === "ACCEPTED"
                  ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                  : r.expiresAt,
            }
          : r
      ),
    })),

  betaApplications: initialApplications,
  approvedEmails: initialApprovedEmails,
  addBetaApplication: (app) =>
    set((state) => ({
      betaApplications: [...state.betaApplications, app],
    })),
  updateApplicationStatus: (id, status) =>
    set((state) => {
      const updated = state.betaApplications.map((a) =>
        a.id === id ? { ...a, status } : a
      );
      const newApproved =
        status === "APPROVED"
          ? [
              ...state.approvedEmails,
              ...updated
                .filter((a) => a.id === id && a.status === "APPROVED")
                .map((a) => a.email),
            ]
          : state.approvedEmails;
      return { betaApplications: updated, approvedEmails: newApproved };
    }),
}));
