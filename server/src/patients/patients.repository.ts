// src/patients/patients.repository.ts
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

type PrismaOrTx = typeof prisma | Prisma.TransactionClient;

export function findPatientByEmail(email: string, client: PrismaOrTx = prisma) {
  return client.patient.findUnique({ where: { email } });
}

export function findPatientById(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}

export function findPatients(search?: string) {
  return prisma.patient.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });
}

export function findPatientWithHistory(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          status: true,
          notes: true,
          provider: { select: { id: true, displayName: true } },
        },
        orderBy: { startsAt: "desc" },
      },
    },
  });
}

export function updatePatient(
  id: string,
  data: Partial<{ name: string; phone: string | null; dateOfBirth: string | null; address: string | null }>
) {
  return prisma.patient.update({ where: { id }, data });
}

type PatientData = {
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
};

export function insertPatient(data: PatientData, client: PrismaOrTx = prisma) {
  return client.patient.create({ data });
}

// Undefined fields are left untouched so a later booking that omits an
// optional field doesn't blank out what we already know about the patient.
export function updatePatientContact(
  id: string,
  data: { name: string; phone?: string; dateOfBirth?: string; address?: string },
  client: PrismaOrTx = prisma
) {
  return client.patient.update({ where: { id }, data });
}
