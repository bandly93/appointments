// src/bookingRequests/bookingRequests.service.ts
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { BookingStatus } from "../generated/prisma/enums.js";
import {
  findActiveBookingForSlot,
  insertBookingRequest,
  findBookingRequestByIdWithSecrets,
  findBookingRequestById,
  findBookingRequests,
  updateBookingRequest,
  deleteBookingRequest,
} from "./bookingRequests.repository.js";
import { findPatientByEmail, insertPatient, updatePatientContact } from "../patients/patients.repository.js";
import { findActiveProviderById } from "../availability/availability.repository.js";
import { findMatchingBookableSlot } from "../availability/availability.service.js";
import { insertAppointment } from "../appointments/appointments.repository.js";
import { generateAccessToken, generateVerificationCode, verifyToken } from "./token.js";
import { sendVerificationEmail } from "../lib/mailer.js";

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

function buildMyBookingLink(id: string, rawToken: string, code: string): string {
  return `${CLIENT_URL}/my-booking/${id}?token=${rawToken}&code=${code}`;
}

// A request is only a confirmed hold once the patient's email is verified;
// UNVERIFIED is a time-boxed soft-hold so casual/bad-faith submissions don't
// permanently block a slot.
const PATIENT_EDITABLE_STATUSES: BookingStatus[] = ["UNVERIFIED", "PENDING"];

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
  const { rawCode, codeHash } = generateVerificationCode();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  try {
    const bookingRequest = await prisma.$transaction(
      async (tx) => {
        const existingBooking = await findActiveBookingForSlot(providerId, startsAt, tx);
        if (existingBooking) {
          const isExpiredHold =
            existingBooking.status === "UNVERIFIED" &&
            existingBooking.verificationExpiresAt !== null &&
            existingBooking.verificationExpiresAt.getTime() < Date.now();

          if (!isExpiredHold) throw new Error("SLOT_UNAVAILABLE");
          await updateBookingRequest(existingBooking.id, { status: "EXPIRED" }, tx);
        }

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
            verificationCodeHash: codeHash,
            verificationExpiresAt,
          },
          tx
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    // A mail-provider hiccup shouldn't fail an already-committed booking —
    // the patient can still use the my-booking link, or request a new code —
    // but the caller needs to know delivery failed so it isn't silently lost.
    const link = buildMyBookingLink(bookingRequest.id, rawToken, rawCode);
    let emailSent = true;
    try {
      await sendVerificationEmail(email, rawCode, link);
    } catch (err) {
      emailSent = false;
      console.error("Failed to send verification email", err);
    }

    return { bookingRequest, accessToken: rawToken, emailSent };
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2002" || err.code === "P2034")) {
      throw new Error("SLOT_UNAVAILABLE");
    }
    throw err;
  }
}

async function loadWithSecrets(id: string, rawToken: string) {
  const bookingRequest = await findBookingRequestByIdWithSecrets(id);
  if (!bookingRequest || !verifyToken(rawToken, bookingRequest.accessTokenHash)) {
    throw new Error("NOT_FOUND");
  }
  return bookingRequest;
}

function toSafeBookingRequest<
  T extends {
    accessTokenHash: string;
    verificationCodeHash: string | null;
    verificationExpiresAt: Date | null;
    verificationAttempts: number;
  }
>(bookingRequest: T) {
  const { accessTokenHash, verificationCodeHash, verificationExpiresAt, verificationAttempts, ...safe } = bookingRequest;
  return safe;
}

export async function getBookingRequestForPatient(id: string, rawToken: string) {
  return toSafeBookingRequest(await loadWithSecrets(id, rawToken));
}

const patientUpdateSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});

export async function updateBookingRequestAsPatient(id: string, rawToken: string, rawInput: unknown) {
  const existing = await loadWithSecrets(id, rawToken);
  if (!PATIENT_EDITABLE_STATUSES.includes(existing.status)) throw new Error("INVALID_STATUS");

  const parsed = patientUpdateSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  return updateBookingRequest(id, { notes: parsed.data.notes });
}

export async function cancelBookingRequestAsPatient(id: string, rawToken: string) {
  const existing = await loadWithSecrets(id, rawToken);
  if (!PATIENT_EDITABLE_STATUSES.includes(existing.status)) throw new Error("INVALID_STATUS");

  return updateBookingRequest(id, { status: "CANCELLED" });
}

const verifyCodeSchema = z.object({
  code: z.string().trim().length(6),
});

export async function verifyBookingRequestEmail(id: string, rawToken: string, rawInput: unknown) {
  const existing = await loadWithSecrets(id, rawToken);
  if (existing.status !== "UNVERIFIED") throw new Error("INVALID_STATUS");

  const parsed = verifyCodeSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  if (!existing.verificationExpiresAt || existing.verificationExpiresAt.getTime() < Date.now()) {
    throw new Error("CODE_EXPIRED");
  }

  if (existing.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    throw new Error("TOO_MANY_ATTEMPTS");
  }

  const isMatch = existing.verificationCodeHash !== null && verifyToken(parsed.data.code, existing.verificationCodeHash);
  if (!isMatch) {
    await updateBookingRequest(id, { verificationAttempts: existing.verificationAttempts + 1 });
    throw new Error("INVALID_CODE");
  }

  return updateBookingRequest(id, {
    status: "PENDING",
    verificationCodeHash: null,
    verificationExpiresAt: null,
    verificationAttempts: 0,
  });
}

export async function resendVerificationCode(id: string, rawToken: string) {
  const existing = await loadWithSecrets(id, rawToken);
  if (existing.status !== "UNVERIFIED") throw new Error("INVALID_STATUS");

  const { rawCode, codeHash } = generateVerificationCode();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  await updateBookingRequest(id, {
    verificationCodeHash: codeHash,
    verificationExpiresAt,
    verificationAttempts: 0,
  });

  try {
    await sendVerificationEmail(existing.patient.email, rawCode, buildMyBookingLink(id, rawToken, rawCode));
  } catch (err) {
    console.error("Failed to send verification email", err);
    throw new Error("EMAIL_SEND_FAILED");
  }
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
