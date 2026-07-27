// src/appointments/appointments.controller.ts
import { Request, Response } from "express";
import { listAppointments, editAppointment, removeAppointment } from "./appointments.service.js";

export async function getAppointments(req: Request, res: Response) {
  const queryString = (name: string) => (typeof req.query[name] === "string" ? (req.query[name] as string) : undefined);
  const appointments = await listAppointments({
    status: queryString("status"),
    date: queryString("date"),
    from: queryString("from"),
    to: queryString("to"),
    providerId: queryString("providerId"),
  });
  res.json({ success: true, appointments });
}

export async function patchAppointment(req: Request, res: Response) {
  try {
    const appointment = await editAppointment(String(req.params.id), req.body);
    res.json({ success: true, appointment });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Appointment not found" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a valid appointment update" });
    }
    throw err;
  }
}

export async function deleteAppointmentHandler(req: Request, res: Response) {
  try {
    await removeAppointment(String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Appointment not found" });
    }
    throw err;
  }
}
