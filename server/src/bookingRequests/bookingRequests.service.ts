// src/bookingRequests/bookingRequests.service.ts
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { BookingStatus } from "../generated/prisma/enums.js";
import {
  findActiveBookingForSlot,
  countActiveBookingRequestsForPatient,
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
import {
  insertAppointment,
  findAppointmentByBookingRequestId,
  updateAppointment as updateAppointmentRecord,
} from "../appointments/appointments.repository.js";
import { generateAccessToken, verifyToken } from "../lib/token.js";
import { sendVerificationEmail, sendRequestPendingEmail, sendBookingConfirmedEmail } from "../lib/mailer.js";

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const MAX_ACTIVE_REQUESTS_PER_PATIENT = 3;
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

function buildMyBookingLink(id: string, rawToken: string): string {
  return `${CLIENT_URL}/my-booking/${id}?token=${rawToken}`;
}

// A request is only a confirmed hold once the patient's email is verified;
// UNVERIFIED is a time-boxed soft-hold so casual/bad-faith submissions don't
// permanently block a slot.
const PATIENT_EDITABLE_STATUSES: BookingStatus[] = ["UNVERIFIED", "PENDING"];

const patientSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().trim().min(1).max(300).optional(),
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

        const contact = {
          name: patientInput.name,
          phone: patientInput.phone,
          dateOfBirth: patientInput.dateOfBirth,
          address: patientInput.address,
        };
        const existingPatient = await findPatientByEmail(email, tx);
        const patient = existingPatient
          ? await updatePatientContact(existingPatient.id, contact, tx)
          : await insertPatient({ email, ...contact }, tx);

        const activeCount = await countActiveBookingRequestsForPatient(patient.id, tx);
        if (activeCount >= MAX_ACTIVE_REQUESTS_PER_PATIENT) {
          throw new Error("TOO_MANY_ACTIVE_REQUESTS");
        }

        return insertBookingRequest(
          {
            providerId,
            patientId: patient.id,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            notes,
            accessTokenHash: tokenHash,
            verificationExpiresAt,
          },
          tx
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    // A mail-provider hiccup shouldn't fail an already-committed booking —
    // the patient can still use the my-booking link, or ask us to resend it —
    // but the caller needs to know delivery failed so it isn't silently lost.
    const link = buildMyBookingLink(bookingRequest.id, rawToken);
    let emailSent = true;
    try {
      await sendVerificationEmail(email, link);
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
    verificationExpiresAt: Date | null;
  }
>(bookingRequest: T) {
  const { accessTokenHash, verificationExpiresAt, ...safe } = bookingRequest;
  return safe;
}

export async function getBookingRequestForPatient(id: string, rawToken: string) {
  return toSafeBookingRequest(await loadWithSecrets(id, rawToken));
}

// For features that need to act on "the patient behind this booking link"
// (e.g. patient document uploads) without needing the rest of the booking.
export async function getPatientIdForBookingRequest(id: string, rawToken: string): Promise<string> {
  const bookingRequest = await loadWithSecrets(id, rawToken);
  return bookingRequest.patientId;
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

// Possessing the raw token (i.e. having received and opened the emailed
// link) is itself the proof of email ownership — there's no separate code to
// check. This only confirms the request is still within its hold window.
export async function verifyBookingRequestEmail(id: string, rawToken: string) {
  const existing = await loadWithSecrets(id, rawToken);
  if (existing.status !== "UNVERIFIED") throw new Error("INVALID_STATUS");

  if (!existing.verificationExpiresAt || existing.verificationExpiresAt.getTime() < Date.now()) {
    throw new Error("REQUEST_EXPIRED");
  }

  const updated = await updateBookingRequest(id, { status: "PENDING", verificationExpiresAt: null });

  // Same tradeoff as elsewhere: a mail hiccup shouldn't undo an
  // already-verified request — the patient is already looking at their
  // status on-screen right now regardless of whether this email lands.
  try {
    await sendRequestPendingEmail(updated.patient.email, {
      providerName: updated.provider.displayName ?? "your provider",
      startsAt: updated.startsAt,
      link: buildMyBookingLink(id, rawToken),
    });
  } catch (err) {
    console.error("Failed to send pending-request email", err);
  }

  return updated;
}

// Re-sends the same link (the token never changes here) and refreshes the
// hold window, in case the first email didn't arrive or the patient is
// coming back after their original window lapsed.
export async function resendVerificationEmail(id: string, rawToken: string) {
  const existing = await loadWithSecrets(id, rawToken);
  if (existing.status !== "UNVERIFIED") throw new Error("INVALID_STATUS");

  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await updateBookingRequest(id, { verificationExpiresAt });

  try {
    await sendVerificationEmail(existing.patient.email, buildMyBookingLink(id, rawToken));
  } catch (err) {
    console.error("Failed to send verification email", err);
    throw new Error("EMAIL_SEND_FAILED");
  }
}

export function listBookingRequests(status?: string, providerId?: string) {
  return findBookingRequests(status as BookingStatus | undefined, providerId);
}

// Staff/admin can act on any request; providers only on requests for their own
// schedule — the route lets PROVIDER through, so ownership is enforced here.
type Actor = { sub: string; role: string };

function assertActorCanDecide(existing: { providerId: string }, actor: Actor) {
  if (actor.role === "PROVIDER" && existing.providerId !== actor.sub) {
    throw new Error("FORBIDDEN");
  }
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

export async function approveBookingRequest(id: string, actor: Actor) {
  const existing = await findBookingRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");
  assertActorCanDecide(existing, actor);
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  // Rotate the access token: the confirmation link below is the one worth
  // keeping now that the booking is a real appointment, and only the latest
  // issued token for a booking is ever valid (the raw value is never
  // persisted, so a stable link would mean holding onto it in plaintext).
  const { rawToken, tokenHash } = generateAccessToken();

  const appointment = await prisma.$transaction(async (tx) => {
    await updateBookingRequest(id, { status: "APPROVED", accessTokenHash: tokenHash }, tx);
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

  // Same tradeoff as the initial booking email: a mail-provider hiccup
  // shouldn't undo an already-approved appointment.
  try {
    await sendBookingConfirmedEmail(appointment.patient.email, {
      providerName: appointment.provider.displayName ?? "your provider",
      startsAt: appointment.startsAt,
      link: buildMyBookingLink(id, rawToken),
    });
  } catch (err) {
    console.error("Failed to send booking confirmation email", err);
  }

  return appointment;
}

// Staff creating a booking directly — phone call, walk-in, whatever the
// channel — have already confirmed intent and identity in person, so
// there's nothing left to verify by email. Lands straight at APPROVED
// instead of going through UNVERIFIED/PENDING. Otherwise this is the same
// slot-conflict-checked transaction as createBookingRequest, plus the same
// appointment insert as approveBookingRequest above.
export async function createStaffBookingRequest(rawInput: unknown, actor: Actor) {
  const parsed = createBookingRequestSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const { providerId, notes, patient: patientInput } = parsed.data;
  const startsAt = new Date(parsed.data.startsAt);

  if (actor.role === "PROVIDER" && providerId !== actor.sub) {
    throw new Error("FORBIDDEN");
  }

  const provider = await findActiveProviderById(providerId);
  if (!provider) throw new Error("PROVIDER_NOT_FOUND");

  const slot = await findMatchingBookableSlot(providerId, startsAt);
  if (!slot) throw new Error("SLOT_UNAVAILABLE");

  const email = patientInput.email.toLowerCase();
  const { rawToken, tokenHash } = generateAccessToken();

  try {
    const appointment = await prisma.$transaction(
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

        const contact = {
          name: patientInput.name,
          phone: patientInput.phone,
          dateOfBirth: patientInput.dateOfBirth,
          address: patientInput.address,
        };
        const existingPatient = await findPatientByEmail(email, tx);
        const patient = existingPatient
          ? await updatePatientContact(existingPatient.id, contact, tx)
          : await insertPatient({ email, ...contact }, tx);

        const bookingRequest = await insertBookingRequest(
          {
            providerId,
            patientId: patient.id,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            notes,
            accessTokenHash: tokenHash,
            verificationExpiresAt: null,
            status: "APPROVED",
          },
          tx
        );

        return insertAppointment(
          {
            providerId,
            patientId: patient.id,
            bookingRequestId: bookingRequest.id,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            notes,
          },
          tx
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    let emailSent = true;
    try {
      await sendBookingConfirmedEmail(email, {
        providerName: appointment.provider.displayName ?? "your provider",
        startsAt: appointment.startsAt,
        link: buildMyBookingLink(appointment.bookingRequestId!, rawToken),
      });
    } catch (err) {
      emailSent = false;
      console.error("Failed to send booking confirmation email", err);
    }

    return { appointment, emailSent };
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2002" || err.code === "P2034")) {
      throw new Error("SLOT_UNAVAILABLE");
    }
    throw err;
  }
}

export async function rejectBookingRequest(id: string, actor: Actor) {
  const existing = await findBookingRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");
  assertActorCanDecide(existing, actor);
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  return updateBookingRequest(id, { status: "REJECTED" });
}

export async function removeBookingRequestAsStaff(id: string) {
  const existing = await findBookingRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");

  // A linked appointment can't just be orphaned (onDelete: SetNull) — it would
  // survive as SCHEDULED with nothing left to block the slot, opening the door
  // to a double-booking. Cancel it first, in the same transaction.
  return prisma.$transaction(async (tx) => {
    const appointment = await findAppointmentByBookingRequestId(id, tx);
    if (appointment && appointment.status === "SCHEDULED") {
      await updateAppointmentRecord(appointment.id, { status: "CANCELLED" }, tx);
    }
    return deleteBookingRequest(id, tx);
  });
}
