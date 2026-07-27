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
  }>,
  client: PrismaOrTx = prisma
) {
  return client.documentRequest.update({ where: { id }, data, select: documentRequestSelect });
}
