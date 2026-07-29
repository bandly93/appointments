// src/patientDocuments/patientDocuments.controller.ts
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
import { streamStoredFile } from "../lib/uploads.js";

function fileFromRequest(req: Request): UploadedFile | undefined {
  if (!req.file) return undefined;
  return {
    originalName: req.file.originalname,
    storageKey: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  };
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
    streamStoredFile(res, file);
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
    if (err instanceof Error && err.message === "TOO_MANY_DOCUMENTS") {
      return res.status(429).json({ error: "You've reached the upload limit for this record. Contact our office if you need to add more." });
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
    streamStoredFile(res, file);
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document not found" });
    }
    throw err;
  }
}
