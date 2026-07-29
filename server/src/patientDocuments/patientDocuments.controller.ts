// src/patientDocuments/patientDocuments.controller.ts
import fs from "node:fs";
import { Request, Response } from "express";
import {
  uploadPatientDocumentAsStaff,
  uploadPatientDocumentAsPatient,
  listPatientDocumentsForStaff,
  listPatientDocumentsForPatient,
  getPatientDocumentFileForStaff,
  getPatientDocumentFileForPatient,
  type UploadedFile,
} from "./patientDocuments.service.js";
import { storagePathFor, sanitizeFilenameForHeader } from "../lib/uploads.js";

function fileFromRequest(req: Request): UploadedFile | undefined {
  if (!req.file) return undefined;
  return {
    originalName: req.file.originalname,
    storageKey: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  };
}

async function streamFile(res: Response, file: { storageKey: string; mimeType: string; originalName: string }) {
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${sanitizeFilenameForHeader(file.originalName)}"`);
  fs.createReadStream(storagePathFor(file.storageKey)).pipe(res);
}

export async function getPatientDocuments(req: Request, res: Response) {
  const documents = await listPatientDocumentsForStaff(String(req.params.patientId));
  res.json({ success: true, documents });
}

export async function postPatientDocument(req: Request, res: Response) {
  const file = fileFromRequest(req);
  if (!file) return res.status(400).json({ error: "Choose a file to upload" });

  try {
    const document = await uploadPatientDocumentAsStaff(
      String(req.params.patientId),
      req.user!,
      req.body.documentType,
      req.body.visibleToPatient !== "false",
      file
    );
    res.status(201).json({ success: true, document });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a document type" });
    }
    throw err;
  }
}

export async function getPatientDocumentFile(req: Request, res: Response) {
  try {
    const file = await getPatientDocumentFileForStaff(String(req.params.id));
    await streamFile(res, file);
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document not found" });
    }
    throw err;
  }
}

function getTokenFromQuery(req: Request): string {
  const token = req.query.token;
  return typeof token === "string" ? token : "";
}

export async function getMyPatientDocuments(req: Request, res: Response) {
  try {
    const documents = await listPatientDocumentsForPatient(String(req.params.id), getTokenFromQuery(req));
    res.json({ success: true, documents });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    throw err;
  }
}

export async function postMyPatientDocument(req: Request, res: Response) {
  const file = fileFromRequest(req);
  if (!file) return res.status(400).json({ error: "Choose a file to upload" });

  try {
    const document = await uploadPatientDocumentAsPatient(
      String(req.params.id),
      getTokenFromQuery(req),
      req.body.documentType,
      file
    );
    res.status(201).json({ success: true, document });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a document type" });
    }
    throw err;
  }
}

export async function getMyPatientDocumentFile(req: Request, res: Response) {
  try {
    const file = await getPatientDocumentFileForPatient(
      String(req.params.docId),
      String(req.params.id),
      getTokenFromQuery(req)
    );
    await streamFile(res, file);
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document not found" });
    }
    throw err;
  }
}
