// src/appointments/appointments.service.ts
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { AppointmentStatus } from "../generated/prisma/enums.js";
import {
  findAppointments,
  findAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "./appointments.repository.js";
import { updateBookingRequest } from "../bookingRequests/bookingRequests.repository.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function listAppointments(status?: string, date?: string) {
  const dateRange = date && dateSchema.safeParse(date).success
    ? { from: new Date(`${date}T00:00:00.000Z`), to: new Date(`${date}T23:59:59.999Z`) }
    : undefined;

  return findAppointments(status as AppointmentStatus | undefined, dateRange);
}

const updateAppointmentSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function editAppointment(id: string, rawInput: unknown) {
  const existing = await findAppointmentById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const parsed = updateAppointmentSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  return updateAppointment(id, parsed.data);
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
