// src/bookingRequests/bookingRequests.repository.ts
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { BookingStatus } from "../generated/prisma/enums.js";

type PrismaOrTx = typeof prisma | Prisma.TransactionClient;

const bookingRequestSelect = {
  id: true,
  providerId: true,
  patientId: true,
  startsAt: true,
  endsAt: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  provider: { select: { id: true, displayName: true } },
  patient: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.BookingRequestSelect;

export function findActiveBookingForSlot(providerId: string, startsAt: Date, client: PrismaOrTx = prisma) {
  return client.bookingRequest.findFirst({
    where: { providerId, startsAt, status: { in: ["UNVERIFIED", "PENDING", "APPROVED"] } },
  });
}

export function countActiveBookingRequestsForPatient(patientId: string, client: PrismaOrTx = prisma) {
  return client.bookingRequest.count({
    where: { patientId, status: { in: ["UNVERIFIED", "PENDING"] } },
  });
}

type InsertData = {
  providerId: string;
  patientId: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string;
  accessTokenHash: string;
  verificationCodeHash: string;
  verificationExpiresAt: Date;
};

export function insertBookingRequest(data: InsertData, client: PrismaOrTx = prisma) {
  return client.bookingRequest.create({ data, select: bookingRequestSelect });
}

export function findBookingRequestByIdWithSecrets(id: string, client: PrismaOrTx = prisma) {
  return client.bookingRequest.findUnique({
    where: { id },
    select: {
      ...bookingRequestSelect,
      accessTokenHash: true,
      verificationCodeHash: true,
      verificationExpiresAt: true,
      verificationAttempts: true,
    },
  });
}

export function findBookingRequestById(id: string) {
  return prisma.bookingRequest.findUnique({ where: { id }, select: bookingRequestSelect });
}

export function findBookingRequests(status?: BookingStatus) {
  return prisma.bookingRequest.findMany({
    where: status ? { status } : undefined,
    select: bookingRequestSelect,
    orderBy: { startsAt: "asc" },
  });
}

export function updateBookingRequest(
  id: string,
  data: Partial<{
    notes: string;
    status: BookingStatus;
    verificationCodeHash: string | null;
    verificationExpiresAt: Date | null;
    verificationAttempts: number;
  }>,
  client: PrismaOrTx = prisma
) {
  return client.bookingRequest.update({ where: { id }, data, select: bookingRequestSelect });
}

export function deleteBookingRequest(id: string) {
  return prisma.bookingRequest.delete({ where: { id } });
}
