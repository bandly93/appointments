// src/availability/slots.ts
import type { DayOfWeek } from "../generated/prisma/enums.js";
import { dayOfWeekForDateString, eachDateString, zonedTimeToUtc } from "./timezone.js";

export type BookableSlot = { startsAt: Date; endsAt: Date };

export type AvailabilityRuleLike = {
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  slotDurationMinutes: number;
  timezone: string;
};

/**
 * Pure function: given a provider's recurring weekly rules and the set of
 * already-booked instants (epoch ms), enumerate concrete bookable slots for
 * a date range. Keeping this free of I/O makes it directly testable.
 */
export function computeBookableSlots(
  rules: AvailabilityRuleLike[],
  bookedInstants: Set<number>,
  fromDateStr: string,
  toDateStr: string,
  now: Date
): BookableSlot[] {
  const slots: BookableSlot[] = [];

  for (const dateStr of eachDateString(fromDateStr, toDateStr)) {
    const weekday = dayOfWeekForDateString(dateStr);
    const rulesForDay = rules.filter((r) => r.dayOfWeek === weekday);

    for (const rule of rulesForDay) {
      for (
        let minute = rule.startMinute;
        minute + rule.slotDurationMinutes <= rule.endMinute;
        minute += rule.slotDurationMinutes
      ) {
        const startsAt = zonedTimeToUtc(dateStr, minute, rule.timezone);
        if (startsAt.getTime() < now.getTime()) continue;
        if (bookedInstants.has(startsAt.getTime())) continue;

        const endsAt = zonedTimeToUtc(dateStr, minute + rule.slotDurationMinutes, rule.timezone);
        slots.push({ startsAt, endsAt });
      }
    }
  }

  slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return slots;
}
