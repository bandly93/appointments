// src/lib/duration.ts
import { z } from "zod";

// Shared across booking-request creation, approval, and appointment edits —
// staff/providers can extend or shrink a booking within these bounds;
// patients never see this control and always get the availability rule's
// nominal slot length.
export const MIN_DURATION_MINUTES = 15;
export const MAX_DURATION_MINUTES = 480;

export const durationMinutesSchema = z
  .number()
  .int()
  .min(MIN_DURATION_MINUTES)
  .max(MAX_DURATION_MINUTES)
  .multipleOf(15)
  .optional();

export function endsAtFromDuration(startsAt: Date, durationMinutes: number): Date {
  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}
