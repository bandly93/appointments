// src/patientDocuments/patientDocuments.repository.ts
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

const patientDocumentSelect = {
  id: true,
  patientId: true,
  documentType: true,
  uploadedByRole: true,
  uploadedByUser: { select: { id: true, email: true, displayName: true } },
  visibleToPatient: true,
  fileOriginalName: true,
  fileMimeType: true,
  fileSizeBytes: true,
  createdAt: true,
} satisfies Prisma.PatientDocumentSelect;

type InsertData = {
  patientId: string;
  documentType: string;
  uploadedByUserId?: string;
  uploadedByRole: string;
  visibleToPatient: boolean;
  fileOriginalName: string;
  fileStorageKey: string;
  fileMimeType: string;
  fileSizeBytes: number;
};

export function insertPatientDocument(data: InsertData) {
  return prisma.patientDocument.create({ data, select: patientDocumentSelect });
}

export function countPatientUploadedDocuments(patientId: string) {
  return prisma.patientDocument.count({ where: { patientId, uploadedByRole: "PATIENT" } });
}

export function findPatientDocuments(patientId: string, onlyVisibleToPatient: boolean) {
  return prisma.patientDocument.findMany({
    where: { patientId, ...(onlyVisibleToPatient ? { visibleToPatient: true } : {}) },
    select: patientDocumentSelect,
    orderBy: { createdAt: "desc" },
  });
}

// Only for server-side file streaming — includes the on-disk storage key,
// which must never be sent to a client.
export function findPatientDocumentFile(id: string) {
  return prisma.patientDocument.findUnique({
    where: { id },
    select: {
      patientId: true,
      visibleToPatient: true,
      fileStorageKey: true,
      fileOriginalName: true,
      fileMimeType: true,
    },
  });
}
