/**
 * Zod schemas for API request validation. Enforce length limits and formats.
 */

import { z } from "zod";

const uuid = z.string().uuid();
const email = z.string().min(1).max(320).email().transform((s) => s.toLowerCase().trim());
const name = z.string().min(1).max(200).trim();
const phone = z.string().min(1).max(50).trim();
const messageOptional = z.string().max(2000).trim().optional();
const dateLike = z.string().min(10).max(32);

export const bookingRequestSchema = z
  .object({
    listingId: uuid,
    guestName: name,
    guestEmail: email,
    guestPhone: phone,
    checkIn: dateLike,
    checkOut: dateLike,
    message: messageOptional,
  })
  .refine((d) => new Date(d.checkOut).getTime() > new Date(d.checkIn).getTime(), {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export const storageRequestSchema = z.object({
  listingId: uuid,
  guestName: name,
  guestEmail: email,
  guestPhone: phone,
  moveInDate: dateLike,
  months: z.number().int().min(1).max(120).optional(),
  message: messageOptional,
});

export const betaApplySchema = z.object({
  name,
  email,
  phone,
  notes: z.string().max(2000).trim().optional(),
});

const latLng = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

/** Minimal validation for host listing create: types and key ranges. */
export const createListingSchema = z.object({
  listingType: z.enum(["STAY", "STORAGE"]),
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(10000).trim(),
  nearTown: z.string().min(1).max(200).trim(),
  lat: latLng,
  lng,
  maxRigLength: z.number().int().min(1).max(200),
  // STAY
  slideOutsAllowed: z.boolean().optional(),
  pullThrough: z.boolean().optional(),
  electric: z.enum(["NONE", "15", "30", "50"]).optional(),
  water: z.boolean().optional(),
  sewage: z.boolean().optional(),
  gas: z.boolean().optional(),
  nightlyPriceCents: z.number().int().min(0).optional(),
  minStayNights: z.number().int().min(1).max(365).optional(),
  maxStayNights: z.number().int().min(1).max(365).optional(),
  blockedDates: z.array(z.string()).max(500).optional(),
  // STORAGE
  storageType: z.enum(["OUTDOOR", "COVERED", "INDOOR"]).optional(),
  access: z.enum(["24_7", "DAYTIME_ONLY", "SCHEDULED"]).optional(),
  securityFeatures: z.array(z.string()).max(20).optional(),
  powerAvailable: z.boolean().optional(),
  noLivingOnSite: z.boolean().optional(),
  monthlyPriceCents: z.number().int().min(0).optional(),
  depositCents: z.number().int().min(0).optional(),
  minimumMonths: z.number().int().min(1).max(120).optional(),
  isAvailable: z.boolean().optional(),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export type StorageRequestInput = z.infer<typeof storageRequestSchema>;
export type BetaApplyInput = z.infer<typeof betaApplySchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;

/** Parse JSON body and validate with schema; returns { ok, data } or { ok: false, errorMessage }. */
export function parseAndValidate<T>(
  body: unknown,
  schema: z.ZodType<T>,
): { ok: true; data: T } | { ok: false; errorMessage: string } {
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  const msg = first?.message ?? "Invalid request";
  return { ok: false, errorMessage: msg };
}
