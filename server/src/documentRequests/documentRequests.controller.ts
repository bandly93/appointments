// src/documentRequests/documentRequests.controller.ts
import fs from "node:fs";
import { Request, Response } from "express";
import {
  listDocumentRequests,
  fulfillDocumentRequest,
  declineDocumentRequest,
  getDocumentRequestFileForStaff,
  type UploadedFile,
} from "./documentRequests.service.js";
import { storagePathFor, sanitizeFilenameForHeader } from "../lib/uploads.js";

export async function getDocumentRequests(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const documentRequests = await listDocumentRequests(status);
  res.json({ success: true, documentRequests });
}

export async function postFulfill(req: Request, res: Response) {
  const uploaded = req.file
    ? ({
        originalName: req.file.originalname,
        storageKey: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      } satisfies UploadedFile)
    : undefined;

  try {
    const documentRequest = await fulfillDocumentRequest(String(req.params.id), uploaded);
    res.json({ success: true, documentRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "Only pending requests can be fulfilled" });
    }
    throw err;
  }
}

export async function streamDocumentFile(
  res: Response,
  file: { storageKey: string; mimeType: string; originalName: string }
) {
  const filePath = storagePathFor(file.storageKey);
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${sanitizeFilenameForHeader(file.originalName)}"`
  );
  fs.createReadStream(filePath).pipe(res);
}

export async function getDocumentRequestFile(req: Request, res: Response) {
  try {
    const file = await getDocumentRequestFileForStaff(String(req.params.id));
    await streamDocumentFile(res, file);
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "No file attached to this request" });
    }
    throw err;
  }
}

export async function postDecline(req: Request, res: Response) {
  try {
    const documentRequest = await declineDocumentRequest(String(req.params.id));
    res.json({ success: true, documentRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "Only pending requests can be declined" });
    }
    throw err;
  }
}
