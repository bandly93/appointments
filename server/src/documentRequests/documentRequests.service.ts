// src/documentRequests/documentRequests.service.ts
import { z } from "zod";
import type { DocumentRequestStatus } from "../generated/prisma/enums.js";
import {
  countActiveDocumentRequestsForPatient,
  insertDocumentRequest,
  findDocumentRequestByIdWithSecrets,
  findDocumentRequestById,
  findDocumentRequests,
  updateDocumentRequest,
} from "./documentRequests.repository.js";
import { findPatientByEmail } from "../patients/patients.repository.js";
import { generateAccessToken, generateVerificationCode, verifyToken } from "../lib/token.js";
import { sendDocumentRequestEmail } from "../lib/mailer.js";

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_ACTIVE_REQUESTS_PER_PATIENT = 3;
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

function buildMyDocumentsLink(id: string, rawToken: string, code: string): string {
  return `${CLIENT_URL}/my-documents/${id}?token=${rawToken}&code=${code}`;
}

const DOCUMENT_EDITABLE_STATUSES: DocumentRequestStatus[] = ["UNVERIFIED", "PENDING"];

const createDocumentRequestSchema = z.object({
  email: z.string().trim().email(),
  documentType: z.string().trim().min(1).max(100),
  message: z.string().trim().max(1000).optional(),
});

// Deliberately returns the same shape regardless of whether a patient record
// exists for the email, so this endpoint can't be used to enumerate patients.
// `emailSent` is only meaningful when a request was actually created.
export async function createDocumentRequest(rawInput: unknown): Promise<{ emailSent: boolean }> {
  const parsed = createDocumentRequestSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const email = parsed.data.email.toLowerCase();
  const patient = await findPatientByEmail(email);
  if (!patient) return { emailSent: false };

  // Swallowed rather than thrown: a distinct error here would let a caller
  // distinguish "too many requests" from "no such patient", defeating the
  // point of the generic response.
  const activeCount = await countActiveDocumentRequestsForPatient(patient.id);
  if (activeCount >= MAX_ACTIVE_REQUESTS_PER_PATIENT) {
    return { emailSent: false };
  }

  const { rawToken, tokenHash } = generateAccessToken();
  const { rawCode, codeHash } = generateVerificationCode();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  const documentRequest = await insertDocumentRequest({
    patientId: patient.id,
    documentType: parsed.data.documentType,
    message: parsed.data.message,
    accessTokenHash: tokenHash,
    verificationCodeHash: codeHash,
    verificationExpiresAt,
  });

  const link = buildMyDocumentsLink(documentRequest.id, rawToken, rawCode);
  try {
    await sendDocumentRequestEmail(email, rawCode, link);
    return { emailSent: true };
  } catch (err) {
    console.error("Failed to send document request email", err);
    return { emailSent: false };
  }
}

async function loadWithSecrets(id: string, rawToken: string) {
  const documentRequest = await findDocumentRequestByIdWithSecrets(id);
  if (!documentRequest || !verifyToken(rawToken, documentRequest.accessTokenHash)) {
    throw new Error("NOT_FOUND");
  }
  return documentRequest;
}

function toSafeDocumentRequest<
  T extends {
    accessTokenHash: string;
    verificationCodeHash: string | null;
    verificationExpiresAt: Date | null;
    verificationAttempts: number;
  }
>(documentRequest: T) {
  const { accessTokenHash, verificationCodeHash, verificationExpiresAt, verificationAttempts, ...safe } = documentRequest;
  return safe;
}

export async function getDocumentRequestForPatient(id: string, rawToken: string) {
  return toSafeDocumentRequest(await loadWithSecrets(id, rawToken));
}

export async function cancelDocumentRequestAsPatient(id: string, rawToken: string) {
  const existing = await loadWithSecrets(id, rawToken);
  if (!DOCUMENT_EDITABLE_STATUSES.includes(existing.status)) throw new Error("INVALID_STATUS");

  return updateDocumentRequest(id, { status: "CANCELLED" });
}

const verifyCodeSchema = z.object({
  code: z.string().trim().length(6),
});

export async function verifyDocumentRequestEmail(id: string, rawToken: string, rawInput: unknown) {
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
    await updateDocumentRequest(id, { verificationAttempts: existing.verificationAttempts + 1 });
    throw new Error("INVALID_CODE");
  }

  return updateDocumentRequest(id, {
    status: "PENDING",
    verificationCodeHash: null,
    verificationExpiresAt: null,
    verificationAttempts: 0,
  });
}

export async function resendDocumentRequestCode(id: string, rawToken: string) {
  const existing = await loadWithSecrets(id, rawToken);
  if (existing.status !== "UNVERIFIED") throw new Error("INVALID_STATUS");

  const { rawCode, codeHash } = generateVerificationCode();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  await updateDocumentRequest(id, {
    verificationCodeHash: codeHash,
    verificationExpiresAt,
    verificationAttempts: 0,
  });

  try {
    await sendDocumentRequestEmail(existing.patient.email, rawCode, buildMyDocumentsLink(id, rawToken, rawCode));
  } catch (err) {
    console.error("Failed to send document request email", err);
    throw new Error("EMAIL_SEND_FAILED");
  }
}

export function listDocumentRequests(status?: string) {
  return findDocumentRequests(status as DocumentRequestStatus | undefined);
}

export async function fulfillDocumentRequest(id: string) {
  const existing = await findDocumentRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  return updateDocumentRequest(id, { status: "FULFILLED" });
}

export async function declineDocumentRequest(id: string) {
  const existing = await findDocumentRequestById(id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "PENDING") throw new Error("INVALID_STATUS");

  return updateDocumentRequest(id, { status: "DECLINED" });
}
