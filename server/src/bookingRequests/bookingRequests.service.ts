// src/bookingRequests/bookingRequests.service.ts
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { BookingStatus } from "../generated/prisma/enums.js";
import {
  findActiveBookingForSlot,
  insertBookingRequest,
  findBookingRequestByIdWithToken,
  findBookingRequestById,
  findBookingRequests,
  updateBookingRequest,
  deleteBookingRequest,
} from "./bookingRequests.repository.js";
import { findPatientByEmail, insertPatient, updatePatientContact } from "../patients/patients.repository.js";
import { findActiveProviderById } from "../availability/availability.repository.js";
import { findMatchingBookableSlot } from "../availability/availability.service.js";
import { insertAppointment } from "../appointments/appointments.repository.js";
import { generateAccessToken, verifyToken } from "./token.js";

const patientSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional(),
});

const createBookingRequestSchema = z.object({
  providerId: z.string().min(1),
  startsAt: z.string().datetime(),
  notes: z.string().trim().max(1000).optional(),
  patient: patientSchema,
});

export async function createBookingRequest(rawInput: unknown) {
  const parsed = createBookingRequestSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const { providerId, notes, patient: patientInput } = parsed.data;
  const startsAt = new Date(parsed.data.startsAt);

  const provider = await findActiveProviderById(providerId);
  if (!provider) throw new Error("PROVIDER_NOT_FOUND");

  const slot = await findMatchingBookableSlot(providerId, startsAt);
  if (!slot) throw new Error("SLOT_UNAVAILABLE");

  const email = patientInput.email.toLowerCase();
  const { rawToken, tokenHash } = generateAccessToken();

  try {
    const bookingRequest = await prisma.$transaction(
      async (tx) => {
        const existingBooking = await findActiveBookingForSlot(providerId, startsAt, tx);
        if (existingBooking) throw new Error("SLOT_UNAVAILABLE");

        const existingPatient = await findPatientByEmail(email, tx);
        const patient = existingPatient
          ? await updatePatientContact(existingPatient.id, { name: patientInput.name, phone: patientInput.phone }, tx)
          : await insertPatient({ email, name: patientInput.name, phone: patientInput.phone }, tx);

        return insertBookingRequest(
          {
            providerId,
            patientId: patient.id,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            notes,
            accessTokenHash: tokenHash,
          },
          tx
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return { bookingRequest, accessToken: rawToken };
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2002" || err.code === "P2034")) {
      throw new Error("SLOT_UNAVAILABLE");
    }
    throw err;
  }
}

async function loadAndVerifyAccess(id: string, rawToken: string) {
  const bookingRequest = await findBookingRequestByIdWithToken(id);
  if (!bookingRequest || !verifyToken(rawToken, bookingRequest.accessTokenHash)) {
    throw new Error("NOT_FOUND");
  }
  const { accessTokenHash, ...safeBookingRequest } = bookingRequest;
  return safeBookingRequest;
}

export async function getBookingRequestForPatient(id: string, rawToken: string) {
  return loadAndVerifyAccess(id, rawToken);
}

const patientUpdateSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});

export async function updateBookingRequestAsPatient(id: string, rawToken: string, rawInput: unknown) {
  const existing = await loadAndVerifyAccess(id, rawToken);
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  const parsed = patientUpdateSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  return updateBookingRequest(id, { notes: parsed.data.notes });
}

export async function cancelBookingRequestAsPatient(id: string, rawToken: string) {
  const existing = await loadAndVerifyAccess(id, rawToken);
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  return updateBookingRequest(id, { status: "CANCELLED" });
}

export function listBookingRequests(status?: string) {
  return findBookingRequests(status as BookingStatus | undefined);
}

const staffUpdateSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});

export async function updateBookingRequestAsStaff(id: string, rawInput: unknown) {
  const existing = await findBookingRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const parsed = staffUpdateSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  return updateBookingRequest(id, { notes: parsed.data.notes });
}

export async function approveBookingRequest(id: string) {
  const existing = await findBookingRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  return prisma.$transaction(async (tx) => {
    await updateBookingRequest(id, { status: "APPROVED" }, tx);
    return insertAppointment(
      {
        providerId: existing.providerId,
        patientId: existing.patientId,
        bookingRequestId: id,
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
        notes: existing.notes ?? undefined,
      },
      tx
    );
  });
}

export async function rejectBookingRequest(id: string) {
  const existing = await findBookingRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  return updateBookingRequest(id, { status: "REJECTED" });
}

export async function removeBookingRequestAsStaff(id: string) {
  const existing = await findBookingRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");

  return deleteBookingRequest(id);
}
