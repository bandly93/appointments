// src/documentRequests/documentRequests.controller.ts
import { Request, Response } from "express";
import {
  listDocumentRequests,
  fulfillDocumentRequest,
  declineDocumentRequest,
} from "./documentRequests.service.js";

export async function getDocumentRequests(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const documentRequests = await listDocumentRequests(status);
  res.json({ success: true, documentRequests });
}

export async function postFulfill(req: Request, res: Response) {
  try {
    const documentRequest = await fulfillDocumentRequest(String(req.params.id));
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
