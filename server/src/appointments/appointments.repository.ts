// src/appointments/appointments.repository.ts
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { AppointmentStatus } from "../generated/prisma/enums.js";

type PrismaOrTx = typeof prisma | Prisma.TransactionClient;

const appointmentSelect = {
  id: true,
  providerId: true,
  patientId: true,
  bookingRequestId: true,
  startsAt: true,
  endsAt: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  provider: { select: { id: true, displayName: true } },
  patient: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.AppointmentSelect;

type InsertData = {
  providerId: string;
  patientId: string;
  bookingRequestId: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string;
};

export function insertAppointment(data: InsertData, client: PrismaOrTx = prisma) {
  return client.appointment.create({ data, select: appointmentSelect });
}

export function findAppointments(
  status?: AppointmentStatus,
  dateRange?: { from: Date; to: Date },
  providerId?: string
) {
  return prisma.appointment.findMany({
    where: {
      status,
      providerId,
      startsAt: dateRange ? { gte: dateRange.from, lte: dateRange.to } : undefined,
    },
    select: appointmentSelect,
    orderBy: { startsAt: "asc" },
  });
}

export function findAppointmentById(id: string, client: PrismaOrTx = prisma) {
  return client.appointment.findUnique({ where: { id }, select: appointmentSelect });
}

export function updateAppointment(
  id: string,
  data: Partial<{ notes: string; status: AppointmentStatus; startsAt: Date; endsAt: Date }>,
  client: PrismaOrTx = prisma
) {
  return client.appointment.update({ where: { id }, data, select: appointmentSelect });
}

export function deleteAppointment(id: string, client: PrismaOrTx = prisma) {
  return client.appointment.delete({ where: { id } });
}

export function findAppointmentByBookingRequestId(bookingRequestId: string, client: PrismaOrTx = prisma) {
  return client.appointment.findUnique({ where: { bookingRequestId }, select: appointmentSelect });
}
