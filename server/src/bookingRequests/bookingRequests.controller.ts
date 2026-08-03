// src/bookingRequests/bookingRequests.controller.ts
import { Request, Response } from "express";
import {
  listBookingRequests,
  updateBookingRequestAsStaff,
  approveBookingRequest,
  rejectBookingRequest,
  removeBookingRequestAsStaff,
  createStaffBookingRequest,
} from "./bookingRequests.service.js";

export async function getBookingRequests(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const providerId = typeof req.query.providerId === "string" ? req.query.providerId : undefined;
  const bookingRequests = await listBookingRequests(status, providerId);
  res.json({ success: true, bookingRequests });
}

export async function patchBookingRequest(req: Request, res: Response) {
  try {
    const bookingRequest = await updateBookingRequestAsStaff(String(req.params.id), req.body);
    res.json({ success: true, bookingRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a valid update" });
    }
    throw err;
  }
}

export async function postApprove(req: Request, res: Response) {
  try {
    const appointment = await approveBookingRequest(String(req.params.id), req.user!);
    res.json({ success: true, appointment });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "You can only manage requests for your own schedule" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "Only pending requests can be approved" });
    }
    throw err;
  }
}

export async function postReject(req: Request, res: Response) {
  try {
    const bookingRequest = await rejectBookingRequest(String(req.params.id), req.user!);
    res.json({ success: true, bookingRequest });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "You can only manage requests for your own schedule" });
    }
    if (err instanceof Error && err.message === "INVALID_STATUS") {
      return res.status(409).json({ error: "Only pending requests can be rejected" });
    }
    throw err;
  }
}

export async function postStaffBooking(req: Request, res: Response) {
  try {
    const { appointment, emailSent } = await createStaffBookingRequest(req.body, req.user!);
    res.status(201).json({ success: true, appointment, emailSent });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter valid booking details" });
    }
    if (err instanceof Error && err.message === "PROVIDER_NOT_FOUND") {
      return res.status(404).json({ error: "Provider not found" });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "You can only book on your own schedule" });
    }
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") {
      return res.status(409).json({ error: "That time is no longer available" });
    }
    throw err;
  }
}

export async function deleteBookingRequestHandler(req: Request, res: Response) {
  try {
    await removeBookingRequestAsStaff(String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking request not found" });
    }
    throw err;
  }
}
