import { Router } from "express";
import { getPatients, getPatient, patchPatient } from "./patients.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("STAFF", "ADMIN", "PROVIDER"), getPatients);
router.get("/:id", requireRole("STAFF", "ADMIN", "PROVIDER"), getPatient);
router.patch("/:id", requireRole("STAFF", "ADMIN"), patchPatient);

export default router;
