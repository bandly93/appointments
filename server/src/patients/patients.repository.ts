// src/patients/patients.repository.ts
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

type PrismaOrTx = typeof prisma | Prisma.TransactionClient;

export function findPatientByEmail(email: string, client: PrismaOrTx = prisma) {
  return client.patient.findUnique({ where: { email } });
}

type PatientData = { email: string; name: string; phone?: string };

export function insertPatient(data: PatientData, client: PrismaOrTx = prisma) {
  return client.patient.create({ data });
}

export function updatePatientContact(
  id: string,
  data: { name: string; phone?: string },
  client: PrismaOrTx = prisma
) {
  return client.patient.update({ where: { id }, data });
}
