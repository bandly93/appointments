// src/public/public.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { getSlotsHandler } from "../availability/availability.controller.js";
import {
  createBookingRequest,
  getBookingRequestForPatient,
  updateBookingRequestAsPatient,
  cancelBookingRequestAsPatient,
  verifyBookingRequestEmail,
  resendVerificationCode,
} from "../bookingRequests/bookingRequests.service.js";
import {
  createDocumentRequest,
  getDocumentRequestForPatient,
  cancelDocumentRequestAsPatient,
  verifyDocumentRequestEmail,
  resendDocumentRequestCode,
  getDocumentRequestFileForPatient,
} from "../documentRequests/documentRequests.service.js";
import { streamDocumentFile } from "../documentRequests/documentRequests.controller.js";

export const getPublicSlots = getSlotsHandler;

export async function getPublicProviders(_req: Request, res: Response) {
  const providers = await prisma.user.findMany({
    where: { role: "PROVIDER", availabilityRules: { some: { isActive: true } } },
    select: { id: true, displayName: true },
  });
  res.json({ success: true, providers });
}

export async function postBookingRequest(req: Request, res: Response) {
  try {
    const { bookingRequest, accessToken, emailSent } = await createBookingRequest(req.body);
    res.status(201).json({ success: true, bookingRequest, accessToken, emailSent });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter valid booking details" });
    }
    if (err instanceof Error && err.message === "PROVIDER_NOT_FOUND") {
      return res.status(404).json({ error: "Provider not found" });
    }
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") {
      return res.status(409).json({ error: "That time is no longer available" });
    }
    if (err instanceof Error && err.message === "TOO_MANY_ACTIVE_REQUESTS") {
      return res.status(429).json({
        error: "You already have too many pending appointment requests with this email. Confirm or cancel one before requesting another.",
      });
    }
    throw err;
  }
}

function getTokenFromQuery(req: Request): string {
  const token = req.query.token;
  return typeof token === "string" ? token : "";
}

export async function getMyBookingRequest(req: Request, res: Response) {
  try {
    const bookingRequest = await getBookingRequestForPatient(String(req.params.id), getTokenFromQuery(req));
    res.json({ success: true, bookingRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    throw err;
  }
}

export async function patchMyBookingRequest(req: Request, res: Response) {
  try {
    const bookingRequest = await updateBookingRequestAsPatient(String(req.params.id), getTokenFromQuery(req), req.body);
    res.json({ success: true, bookingRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "This request can no longer be edited" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a valid update" });
    }
    throw err;
  }
}

export async function deleteMyBookingRequest(req: Request, res: Response) {
  try {
    const bookingRequest = await cancelBookingRequestAsPatient(String(req.params.id), getTokenFromQuery(req));
    res.json({ success: true, bookingRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "This request can no longer be cancelled" });
    }
    throw err;
  }
}

export async function postVerifyBookingRequest(req: Request, res: Response) {
  try {
    const bookingRequest = await verifyBookingRequestEmail(String(req.params.id), getTokenFromQuery(req), req.body);
    res.json({ success: true, bookingRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "This request has already been verified" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter the 6-digit code" });
    }
    if (err instanceof Error && err.message === "CODE_EXPIRED") {
      return res.status(410).json({ error: "This code has expired. Request a new one." });
    }
    if (err instanceof Error && err.message === "TOO_MANY_ATTEMPTS") {
      return res.status(429).json({ error: "Too many incorrect attempts. Request a new code." });
    }
    if (err instanceof Error && err.message === "INVALID_CODE") {
      return res.status(400).json({ error: "That code is incorrect" });
    }
    throw err;
  }
}

export async function postResendVerificationCode(req: Request, res: Response) {
  try {
    await resendVerificationCode(String(req.params.id), getTokenFromQuery(req));
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "This request has already been verified" });
    }
    if (err instanceof Error && err.message === "EMAIL_SEND_FAILED") {
      return res.status(502).json({ error: "Failed to send the email. Please try again shortly." });
    }
    throw err;
  }
}

// Always a generic success response — the request may not have been created
// (unknown email, or the patient already has too many active requests) but
// the caller can't tell the difference, so patient records can't be enumerated.
export async function postDocumentRequest(req: Request, res: Response) {
  try {
    const { emailSent } = await createDocumentRequest(req.body);
    res.status(201).json({ success: true, emailSent });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter valid document request details" });
    }
    throw err;
  }
}

export async function getMyDocumentRequest(req: Request, res: Response) {
  try {
    const documentRequest = await getDocumentRequestForPatient(String(req.params.id), getTokenFromQuery(req));
    res.json({ success: true, documentRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document request not found" });
    }
    throw err;
  }
}

export async function deleteMyDocumentRequest(req: Request, res: Response) {
  try {
    const documentRequest = await cancelDocumentRequestAsPatient(String(req.params.id), getTokenFromQuery(req));
    res.json({ success: true, documentRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "This request can no longer be cancelled" });
    }
    throw err;
  }
}

export async function postVerifyDocumentRequest(req: Request, res: Response) {
  try {
    const documentRequest = await verifyDocumentRequestEmail(String(req.params.id), getTokenFromQuery(req), req.body);
    res.json({ success: true, documentRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "This request has already been verified" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter the 6-digit code" });
    }
    if (err instanceof Error && err.message === "CODE_EXPIRED") {
      return res.status(410).json({ error: "This code has expired. Request a new one." });
    }
    if (err instanceof Error && err.message === "TOO_MANY_ATTEMPTS") {
      return res.status(429).json({ error: "Too many incorrect attempts. Request a new code." });
    }
    if (err instanceof Error && err.message === "INVALID_CODE") {
      return res.status(400).json({ error: "That code is incorrect" });
    }
    throw err;
  }
}

export async function postResendDocumentRequestCode(req: Request, res: Response) {
  try {
    await resendDocumentRequestCode(String(req.params.id), getTokenFromQuery(req));
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Document request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "This request has already been verified" });
    }
    if (err instanceof Error && err.message === "EMAIL_SEND_FAILED") {
      return res.status(502).json({ error: "Failed to send the email. Please try again shortly." });
    }
    throw err;
  }
}

export async function getMyDocumentRequestFile(req: Request, res: Response) {
  try {
    const file = await getDocumentRequestFileForPatient(String(req.params.id), getTokenFromQuery(req));
    await streamDocumentFile(res, file);
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "No file attached to this request" });
    }
    throw err;
  }
}
