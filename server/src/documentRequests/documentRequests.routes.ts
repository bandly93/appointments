import { Router } from "express";
import {
  getDocumentRequests,
  postFulfill,
  postDecline,
  getDocumentRequestFile,
} from "./documentRequests.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { documentUpload, handleUploadErrors } from "../lib/uploads.js";

const router = Router();

router.use(requireAuth, requireRole("STAFF", "ADMIN"));
router.get("/", getDocumentRequests);

router.post("/:id/fulfill", documentUpload.single("file"), handleUploadErrors, postFulfill);
router.post("/:id/decline", postDecline);
router.get("/:id/file", getDocumentRequestFile);

export default router;
