// src/availability/availability.service.ts
import { z } from "zod";
import {
  findActiveRulesByProvider,
  findRulesByProvider,
  findRuleById,
  insertRule,
  updateRule,
  deleteRule,
  findActiveBookedInstants,
} from "./availability.repository.js";
import { computeBookableSlots, type BookableSlot } from "./slots.js";

const dayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const ruleFieldsSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  slotDurationMinutes: z.number().int().min(5).max(480).default(30),
  timezone: z.string().min(1),
});

const createRuleSchema = ruleFieldsSchema
  .refine((v) => v.endMinute > v.startMinute, { message: "endMinute must be after startMinute" })
  .refine((v) => (v.endMinute - v.startMinute) % v.slotDurationMinutes === 0, {
    message: "range must be evenly divisible by slot duration",
  });

export function listMyRules(providerId: string) {
  return findRulesByProvider(providerId);
}

export async function createRule(providerId: string, rawInput: unknown) {
  const parsed = createRuleSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  return insertRule(providerId, parsed.data);
}

export async function editRule(providerId: string, ruleId: string, rawInput: unknown) {
  const parsed = createRuleSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const existing = await findRuleById(ruleId);
  if (!existing) throw new Error("RULE_NOT_FOUND");
  if (existing.providerId !== providerId) throw new Error("FORBIDDEN");

  return updateRule(ruleId, parsed.data);
}

export async function removeRule(providerId: string, ruleId: string) {
  const existing = await findRuleById(ruleId);
  if (!existing) throw new Error("RULE_NOT_FOUND");
  if (existing.providerId !== providerId) throw new Error("FORBIDDEN");

  return deleteRule(ruleId);
}

const dateRangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => v.to >= v.from, { message: "to must not be before from" });

export async function getBookableSlots(providerId: string, rawQuery: unknown): Promise<BookableSlot[]> {
  const parsed = dateRangeSchema.safeParse(rawQuery);
  if (!parsed.success) throw new Error("INVALID_INPUT");
  const { from, to } = parsed.data;

  const rules = await findActiveRulesByProvider(providerId);
  if (rules.length === 0) return [];

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);
  const booked = await findActiveBookedInstants(providerId, fromDate, toDate);
  const bookedInstants = new Set(booked.map((b) => b.startsAt.getTime()));

  return computeBookableSlots(rules, bookedInstants, from, to, new Date());
}

/**
 * Confirms `startsAt` is actually one of the provider's generated bookable
 * slots for its calendar date, not just an arbitrary timestamp — used when
 * creating a booking request so patients can't request off-schedule times.
 */
export async function findMatchingBookableSlot(providerId: string, startsAt: Date): Promise<BookableSlot | null> {
  // Widen by a day on each side: a rule's local calendar date can differ from
  // startsAt's UTC calendar date depending on the rule's timezone offset.
  const dayMs = 24 * 60 * 60 * 1000;
  const fromStr = new Date(startsAt.getTime() - dayMs).toISOString().slice(0, 10);
  const toStr = new Date(startsAt.getTime() + dayMs).toISOString().slice(0, 10);

  const rules = await findActiveRulesByProvider(providerId);
  if (rules.length === 0) return null;

  const slots = computeBookableSlots(rules, new Set(), fromStr, toStr, new Date());
  return slots.find((slot) => slot.startsAt.getTime() === startsAt.getTime()) ?? null;
}
