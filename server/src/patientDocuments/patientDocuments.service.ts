// src/patientDocuments/patientDocuments.service.ts
import { z } from "zod";
import {
  insertPatientDocument,
  findPatientDocuments,
  findPatientDocumentFile,
  countPatientUploadedDocuments,
} from "./patientDocuments.repository.js";
import { findPatientById } from "../patients/patients.repository.js";
import { getPatientIdForBookingRequest } from "../bookingRequests/bookingRequests.service.js";
import { deleteStoredFile } from "../lib/uploads.js";

export type UploadedFile = {
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
};

// Staff/provider uploads are trusted and uncapped. Patient self-uploads have
// no request/approval step gating them (unlike DocumentRequest), so without a
// cap a valid booking link could be used to fill disk indefinitely.
const MAX_PATIENT_SELF_UPLOADS = 20;

const documentTypeSchema = z.string().trim().min(1).max(100);

type Actor = { sub: string; role: string };

export async function uploadPatientDocumentAsStaff(
  patientId: string,
  actor: Actor,
  rawDocumentType: unknown,
  visibleToPatient: boolean,
  file: UploadedFile
) {
  const patient = await findPatientById(patientId);
  if (!patient) {
    deleteStoredFile(file.storageKey);
    throw new Error("NOT_FOUND");
  }

  const parsed = documentTypeSchema.safeParse(rawDocumentType);
  if (!parsed.success) {
    deleteStoredFile(file.storageKey);
    throw new Error("INVALID_INPUT");
  }

  return insertPatientDocument({
    patientId,
    documentType: parsed.data,
    uploadedByUserId: actor.sub,
    uploadedByRole: actor.role,
    visibleToPatient,
    fileOriginalName: file.originalName,
    fileStorageKey: file.storageKey,
    fileMimeType: file.mimeType,
    fileSizeBytes: file.sizeBytes,
  });
}

// Patients never log in, so "as the patient" is proven the same way as
// everything else patient-facing: the access token on their booking link.
export async function uploadPatientDocumentAsPatient(
  bookingRequestId: string,
  rawToken: string,
  rawDocumentType: unknown,
  file: UploadedFile
) {
  let patientId: string;
  try {
    patientId = await getPatientIdForBookingRequest(bookingRequestId, rawToken);
  } catch (err) {
    deleteStoredFile(file.storageKey);
    throw err;
  }

  const parsed = documentTypeSchema.safeParse(rawDocumentType);
  if (!parsed.success) {
    deleteStoredFile(file.storageKey);
    throw new Error("INVALID_INPUT");
  }

  const uploadedCount = await countPatientUploadedDocuments(patientId);
  if (uploadedCount >= MAX_PATIENT_SELF_UPLOADS) {
    deleteStoredFile(file.storageKey);
    throw new Error("TOO_MANY_DOCUMENTS");
  }

  return insertPatientDocument({
    patientId,
    documentType: parsed.data,
    uploadedByRole: "PATIENT",
    visibleToPatient: true,
    fileOriginalName: file.originalName,
    fileStorageKey: file.storageKey,
    fileMimeType: file.mimeType,
    fileSizeBytes: file.sizeBytes,
  });
}

export function listPatientDocumentsForStaff(patientId: string) {
  return findPatientDocuments(patientId, false);
}

export async function listPatientDocumentsForPatient(bookingRequestId: string, rawToken: string) {
  const patientId = await getPatientIdForBookingRequest(bookingRequestId, rawToken);
  return findPatientDocuments(patientId, true);
}

export async function getPatientDocumentFileForStaff(id: string) {
  const record = await findPatientDocumentFile(id);
  if (!record) throw new Error("NOT_FOUND");
  return { storageKey: record.fileStorageKey, mimeType: record.fileMimeType, originalName: record.fileOriginalName };
}

export async function getPatientDocumentFileForPatient(id: string, bookingRequestId: string, rawToken: string) {
  const patientId = await getPatientIdForBookingRequest(bookingRequestId, rawToken);
  const record = await findPatientDocumentFile(id);
  if (!record || record.patientId !== patientId || !record.visibleToPatient) {
    throw new Error("NOT_FOUND");
  }
  return { storageKey: record.fileStorageKey, mimeType: record.fileMimeType, originalName: record.fileOriginalName };
}
