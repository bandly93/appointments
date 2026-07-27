// src/patients/patients.service.ts
import { z } from "zod";
import { findPatients, findPatientWithHistory, findPatientById, updatePatient } from "./patients.repository.js";

export function listPatients(search?: string) {
  return findPatients(search?.trim() || undefined);
}

export async function getPatientDetail(id: string) {
  const patient = await findPatientWithHistory(id);
  if (!patient) throw new Error("NOT_FOUND");
  return patient;
}

// Staff corrections; empty string clears an optional field.
const updatePatientSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
});

export async function editPatient(id: string, rawInput: unknown) {
  const existing = await findPatientById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const parsed = updatePatientSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  return updatePatient(id, parsed.data);
}
