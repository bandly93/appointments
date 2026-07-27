// src/patients/patients.controller.ts
import { Request, Response } from "express";
import { listPatients, getPatientDetail, editPatient } from "./patients.service.js";

export async function getPatients(req: Request, res: Response) {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const patients = await listPatients(search);
  res.json({ success: true, patients });
}

export async function getPatient(req: Request, res: Response) {
  try {
    const patient = await getPatientDetail(String(req.params.id));
    res.json({ success: true, patient });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Patient not found" });
    }
    throw err;
  }
}

export async function patchPatient(req: Request, res: Response) {
  try {
    const patient = await editPatient(String(req.params.id), req.body);
    res.json({ success: true, patient });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a valid patient update" });
    }
    throw err;
  }
}
