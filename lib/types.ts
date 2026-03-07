export type ListingType = "STAY" | "STORAGE";

export type ElectricType = "NONE" | "15" | "30" | "50";

export type StorageType = "OUTDOOR" | "COVERED" | "INDOOR";

export type AccessType = "24_7" | "DAYTIME_ONLY" | "SCHEDULED";

export type SecurityFeature =
  | "GATED"
  | "CAMERAS"
  | "LIGHTING"
  | "ON_SITE_HOST"
  | "NONE";

export type ListingStatus = "DRAFT" | "PENDING" | "LIVE" | "SUSPENDED";

export type RequestStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED_BY_GUEST"
  | "CANCELLED_BY_HOST";

export type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type ContractStatus = "ACTIVE" | "CANCELLED" | "ENDED";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Host {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  listingsCount: number;
}

export interface BaseListing {
  id: string;
  listingType: ListingType;
  title: string;
  description: string;
  nearTown: string;
  lat: number;
  lng: number;
  publicLat: number;
  publicLng: number;
  photos: string[];
  status: ListingStatus;
  verified: boolean;
  hostId: string;
  host: Host;
  maxRigLength: number;
  createdAt: string;
}

export interface StayListing extends BaseListing {
  listingType: "STAY";
  slideOutsAllowed: boolean;
  pullThrough: boolean;
  electric: ElectricType;
  water: boolean;
  sewage: boolean;
  gas: boolean;
  nightlyPriceCents: number;
  minStayNights: number;
  maxStayNights: number;
  blockedDates: string[];
}

export interface StorageListing extends BaseListing {
  listingType: "STORAGE";
  storageType: StorageType;
  access: AccessType;
  securityFeatures: SecurityFeature[];
  powerAvailable: boolean;
  noLivingOnSite: boolean;
  monthlyPriceCents: number;
  depositCents: number;
  minimumMonths: number;
  isAvailable: boolean;
}

export type Listing = StayListing | StorageListing;

export interface BookingRequest {
  id: string;
  listingId: string;
  listing: StayListing;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  message?: string;
  checkIn: string;
  checkOut: string;
  totalPriceCents: number;
  status: RequestStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface StorageRequest {
  id: string;
  listingId: string;
  listing: StorageListing;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  message?: string;
  moveInDate: string;
  months: number;
  depositCents: number;
  monthlyPriceCents: number;
  status: RequestStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface BetaApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface SearchFilters {
  destination: string;
  lat?: number;
  lng?: number;
  radius: number;
  checkIn?: string;
  checkOut?: string;
  moveInDate?: string;
  electric: boolean;
  water: boolean;
  sewage: boolean;
  gas: boolean;
  pullThrough: boolean;
  coveredIndoor: boolean;
  access247: boolean;
  gated: boolean;
  cameras: boolean;
  powerAvailable: boolean;
}
