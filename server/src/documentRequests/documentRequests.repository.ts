// src/documentRequests/documentRequests.repository.ts
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { DocumentRequestStatus } from "../generated/prisma/enums.js";

type PrismaOrTx = typeof prisma | Prisma.TransactionClient;

const documentRequestSelect = {
  id: true,
  patientId: true,
  documentType: true,
  message: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  // Original filename/size/type are safe to show (e.g. "results.pdf, 240 KB")
  // but fileStorageKey is never selected here — it's the on-disk path
  // component and only ever read server-side to stream a download.
  fileOriginalName: true,
  fileMimeType: true,
  fileSizeBytes: true,
  fileUploadedAt: true,
  patient: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.DocumentRequestSelect;

export function countActiveDocumentRequestsForPatient(patientId: string, client: PrismaOrTx = prisma) {
  return client.documentRequest.count({
    where: { patientId, status: { in: ["UNVERIFIED", "PENDING"] } },
  });
}

type InsertData = {
  patientId: string;
  documentType: string;
  message?: string;
  accessTokenHash: string;
  verificationCodeHash: string;
  verificationExpiresAt: Date;
};

export function insertDocumentRequest(data: InsertData, client: PrismaOrTx = prisma) {
  return client.documentRequest.create({ data, select: documentRequestSelect });
}

export function findDocumentRequestByIdWithSecrets(id: string, client: PrismaOrTx = prisma) {
  return client.documentRequest.findUnique({
    where: { id },
    select: {
      ...documentRequestSelect,
      accessTokenHash: true,
      verificationCodeHash: true,
      verificationExpiresAt: true,
      verificationAttempts: true,
    },
  });
}

export function findDocumentRequestById(id: string) {
  return prisma.documentRequest.findUnique({ where: { id }, select: documentRequestSelect });
}

// Only for server-side file streaming — includes the on-disk storage key,
// which must never be sent to a client.
export function findDocumentRequestFile(id: string) {
  return prisma.documentRequest.findUnique({
    where: { id },
    select: { status: true, fileStorageKey: true, fileOriginalName: true, fileMimeType: true },
  });
}

export function findDocumentRequests(status?: DocumentRequestStatus) {
  return prisma.documentRequest.findMany({
    where: status ? { status } : undefined,
    select: documentRequestSelect,
    orderBy: { createdAt: "desc" },
  });
}

export function updateDocumentRequest(
  id: string,
  data: Partial<{
    status: DocumentRequestStatus;
    verificationCodeHash: string | null;
    verificationExpiresAt: Date | null;
    verificationAttempts: number;
    fileOriginalName: string | null;
    fileStorageKey: string | null;
    fileMimeType: string | null;
    fileSizeBytes: number | null;
    fileUploadedAt: Date | null;
  }>,
  client: PrismaOrTx = prisma
) {
  return client.documentRequest.update({ where: { id }, data, select: documentRequestSelect });
}
