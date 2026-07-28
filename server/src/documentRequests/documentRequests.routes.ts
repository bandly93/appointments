import { Router } from "express";
import multer from "multer";
import {
  getDocumentRequests,
  postFulfill,
  postDecline,
  getDocumentRequestFile,
} from "./documentRequests.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { documentUpload, UnsupportedFileTypeError, MAX_UPLOAD_BYTES } from "../lib/uploads.js";
import type { NextFunction, Request, Response } from "express";

const router = Router();

router.use(requireAuth, requireRole("STAFF", "ADMIN"));
router.get("/", getDocumentRequests);

function handleUploadErrors(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof UnsupportedFileTypeError) {
    return res.status(400).json({ error: "Unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX." });
  }
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: `File too large. Max size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.` });
  }
  next(err);
}

router.post("/:id/fulfill", documentUpload.single("file"), handleUploadErrors, postFulfill);
router.post("/:id/decline", postDecline);
router.get("/:id/file", getDocumentRequestFile);

export default router;
