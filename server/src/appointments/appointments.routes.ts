import { Router } from "express";
import { getAppointments, patchAppointment, deleteAppointmentHandler } from "./appointments.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("STAFF", "ADMIN", "PROVIDER"), getAppointments);
router.patch("/:id", requireRole("STAFF", "ADMIN"), patchAppointment);
router.delete("/:id", requireRole("STAFF", "ADMIN"), deleteAppointmentHandler);

export default router;
