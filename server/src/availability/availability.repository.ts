// src/availability/availability.repository.ts
import { prisma } from "../lib/prisma.js";
import type { DayOfWeek } from "../generated/prisma/enums.js";

export function findActiveRulesByProvider(providerId: string) {
  return prisma.availabilityRule.findMany({
    where: { providerId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
}

export function findRulesByProvider(providerId: string) {
  return prisma.availabilityRule.findMany({
    where: { providerId },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
}

export function findRuleById(id: string) {
  return prisma.availabilityRule.findUnique({ where: { id } });
}

type RuleFields = {
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  slotDurationMinutes: number;
  timezone: string;
};

export function insertRule(providerId: string, data: RuleFields) {
  return prisma.availabilityRule.create({ data: { providerId, ...data } });
}

export function updateRule(id: string, data: Partial<RuleFields>) {
  return prisma.availabilityRule.update({ where: { id }, data });
}

export function deleteRule(id: string) {
  return prisma.availabilityRule.delete({ where: { id } });
}

export function findActiveBookedInstants(providerId: string, from: Date, to: Date) {
  return prisma.bookingRequest.findMany({
    where: {
      providerId,
      status: { in: ["PENDING", "APPROVED"] },
      startsAt: { gte: from, lte: to },
    },
    select: { startsAt: true },
  });
}

export function findActiveProviderById(providerId: string) {
  return prisma.user.findFirst({
    where: { id: providerId, role: "PROVIDER" },
    select: { id: true, displayName: true },
  });
}
