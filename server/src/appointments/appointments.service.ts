// src/appointments/appointments.service.ts
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { AppointmentStatus } from "../generated/prisma/enums.js";
import {
  findAppointments,
  findAppointmentById,
  updateAppointment,
  deleteAppointment,
  findOverlappingAppointment,
} from "./appointments.repository.js";
import { updateBookingRequest } from "../bookingRequests/bookingRequests.repository.js";
import { buildMyBookingLink } from "../bookingRequests/bookingRequests.service.js";
import { durationMinutesSchema, endsAtFromDuration } from "../lib/duration.js";
import { generateAccessToken } from "../lib/token.js";
import { sendAppointmentUpdatedEmail } from "../lib/mailer.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

type ListFilters = {
  status?: string;
  date?: string;
  from?: string;
  to?: string;
  providerId?: string;
};

export function listAppointments({ status, date, from, to, providerId }: ListFilters) {
  const isDate = (value?: string): value is string => !!value && dateSchema.safeParse(value).success;

  // `from`/`to` select a range (e.g. a calendar week); `date` remains the
  // single-day shorthand used by the dashboard.
  const dateRange = isDate(from) && isDate(to)
    ? { from: new Date(`${from}T00:00:00.000Z`), to: new Date(`${to}T23:59:59.999Z`) }
    : isDate(date)
      ? { from: new Date(`${date}T00:00:00.000Z`), to: new Date(`${date}T23:59:59.999Z`) }
      : undefined;

  return findAppointments(status as AppointmentStatus | undefined, dateRange, providerId);
}

const updateAppointmentSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().trim().max(1000).optional(),
  durationMinutes: durationMinutesSchema,
});

type Actor = { sub: string; role: string };

export async function editAppointment(id: string, rawInput: unknown, actor: Actor) {
  const existing = await findAppointmentById(id);
  if (!existing) throw new Error("NOT_FOUND");

  // Staff/admin can edit any appointment; providers only their own — same
  // ownership rule as booking-request decisions.
  if (actor.role === "PROVIDER" && existing.providerId !== actor.sub) {
    throw new Error("FORBIDDEN");
  }

  const parsed = updateAppointmentSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");
  const { durationMinutes, ...fields } = parsed.data;

  // A cancelled/completed appointment isn't really "on the calendar" for
  // duration purposes — extending one would sync a stale endsAt onto its
  // booking request and could even email the patient about a change to an
  // appointment that isn't happening.
  if (durationMinutes && existing.status !== "SCHEDULED") {
    throw new Error("INVALID_STATUS");
  }

  const candidateEndsAt = durationMinutes ? endsAtFromDuration(existing.startsAt, durationMinutes) : undefined;
  const endsAtChanged = !!candidateEndsAt && candidateEndsAt.getTime() !== existing.endsAt.getTime();

  // Cancelling here must also free the slot, same as removeAppointment below —
  // otherwise the booking request stays APPROVED and permanently blocks it.
  // A duration change needs the linked booking request's endsAt kept in sync
  // too, since the patient's my-booking page reads from that record, not the
  // appointment — and (unless the appointment is being cancelled in the same
  // update) a fresh access token so the notification email below has a valid
  // link to send.
  const bookingRequestUpdates: Partial<{ status: "CANCELLED"; endsAt: Date; accessTokenHash: string }> = {};
  if (fields.status === "CANCELLED") bookingRequestUpdates.status = "CANCELLED";

  let notifyLink: string | undefined;
  if (endsAtChanged) {
    bookingRequestUpdates.endsAt = candidateEndsAt!;
    if (existing.bookingRequestId && fields.status !== "CANCELLED") {
      const { rawToken, tokenHash } = generateAccessToken();
      bookingRequestUpdates.accessTokenHash = tokenHash;
      notifyLink = buildMyBookingLink(existing.bookingRequestId, rawToken);
    }
  }

  try {
    const appointment = await prisma.$transaction(
      async (tx) => {
        if (endsAtChanged) {
          // Unlike a brand-new booking, this appointment is already live on
          // the calendar — extending it can newly collide with whatever the
          // provider has right after it. Re-checked inside the transaction
          // (not before it) so a concurrent edit/creation can't slip a
          // genuine overlap past the gap between the check and the write.
          const conflict = await findOverlappingAppointment(existing.providerId, existing.startsAt, candidateEndsAt!, id, tx);
          if (conflict) throw new Error("SLOT_UNAVAILABLE");
        }
        if (existing.bookingRequestId && Object.keys(bookingRequestUpdates).length > 0) {
          await updateBookingRequest(existing.bookingRequestId, bookingRequestUpdates, tx);
        }
        return updateAppointment(id, { ...fields, ...(endsAtChanged ? { endsAt: candidateEndsAt } : {}) }, tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (endsAtChanged && notifyLink) {
      // Same tradeoff as elsewhere: a mail-provider hiccup shouldn't undo an
      // already-committed duration change.
      try {
        await sendAppointmentUpdatedEmail(appointment.patient.email, {
          providerName: appointment.provider.displayName ?? "your provider",
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          link: notifyLink,
        });
      } catch (err) {
        console.error("Failed to send appointment-updated email", err);
      }
    }

    return appointment;
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2002" || err.code === "P2034")) {
      throw new Error("SLOT_UNAVAILABLE");
    }
    throw err;
  }
}

export async function removeAppointment(id: string) {
  const existing = await findAppointmentById(id);
  if (!existing) throw new Error("NOT_FOUND");

  // Deleting the appointment must also free the slot: revert the originating
  // booking request to CANCELLED, otherwise the partial unique index leaves
  // it permanently blocked with no live appointment.
  return prisma.$transaction(async (tx) => {
    if (existing.bookingRequestId) {
      await updateBookingRequest(existing.bookingRequestId, { status: "CANCELLED" }, tx);
    }
    return deleteAppointment(id, tx);
  });
}
