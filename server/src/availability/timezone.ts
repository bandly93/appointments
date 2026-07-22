// src/availability/timezone.ts
import type { DayOfWeek } from "../generated/prisma/enums.js";

const WEEKDAYS_BY_UTC_INDEX: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function dayOfWeekForDateString(dateStr: string): DayOfWeek {
  const [year, month, day] = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return WEEKDAYS_BY_UTC_INDEX[utcDate.getUTCDay()];
}

function getWallTimeInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Converts a local wall-clock time ("YYYY-MM-DD" + minutes since midnight, in
 * `timeZone`) to the concrete UTC instant it represents. Uses the standard
 * double-conversion trick via Intl so DST offsets are resolved correctly
 * without a date library.
 */
export function zonedTimeToUtc(dateStr: string, minuteOfDay: number, timeZone: string): Date {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const naiveUtc = new Date(`${dateStr}T${pad(hour)}:${pad(minute)}:00.000Z`);

  const wall = getWallTimeInZone(naiveUtc, timeZone);
  const wallAsUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const offset = naiveUtc.getTime() - wallAsUtc;

  return new Date(naiveUtc.getTime() + offset);
}

export function eachDateString(fromDateStr: string, toDateStr: string): string[] {
  const [fy, fm, fd] = fromDateStr.split("-").map(Number);
  const [ty, tm, td] = toDateStr.split("-").map(Number);

  const dates: string[] = [];
  let cursor = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);

  while (cursor <= end) {
    const d = new Date(cursor);
    dates.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
    cursor += 24 * 60 * 60 * 1000;
  }

  return dates;
}
