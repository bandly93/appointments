import { Router } from "express";
import { getPatients, getPatient, patchPatient } from "./patients.controller.js";
import {
  getPatientDocuments,
  postPatientDocument,
  getPatientDocumentFile,
} from "../patientDocuments/patientDocuments.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { documentUpload, handleUploadErrors } from "../lib/uploads.js";

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("STAFF", "ADMIN", "PROVIDER"), getPatients);
router.get("/:id", requireRole("STAFF", "ADMIN", "PROVIDER"), getPatient);
router.patch("/:id", requireRole("STAFF", "ADMIN"), patchPatient);

// Standalone document library on a patient's record — separate from
// DocumentRequest, which tracks a patient-initiated request/fulfill flow.
router.get("/:patientId/documents", requireRole("STAFF", "ADMIN", "PROVIDER"), getPatientDocuments);
router.post(
  "/:patientId/documents",
  requireRole("STAFF", "ADMIN", "PROVIDER"),
  documentUpload.single("file"),
  handleUploadErrors,
  postPatientDocument
);
router.get("/documents/:id/file", requireRole("STAFF", "ADMIN", "PROVIDER"), getPatientDocumentFile);

export default router;
