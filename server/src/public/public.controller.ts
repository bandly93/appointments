// src/public/public.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { getSlotsHandler } from "../availability/availability.controller.js";
import {
  createBookingRequest,
  getBookingRequestForPatient,
  updateBookingRequestAsPatient,
  cancelBookingRequestAsPatient,
} from "../bookingRequests/bookingRequests.service.js";

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
    const { bookingRequest, accessToken } = await createBookingRequest(req.body);
    res.status(201).json({ success: true, bookingRequest, accessToken });
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
