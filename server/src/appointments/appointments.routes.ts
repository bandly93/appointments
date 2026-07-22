import { Router } from "express";
import { getAppointments, patchAppointment, deleteAppointmentHandler } from "./appointments.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("STAFF", "ADMIN"));
router.get("/", getAppointments);
router.patch("/:id", patchAppointment);
router.delete("/:id", deleteAppointmentHandler);

export default router;
