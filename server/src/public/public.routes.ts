import { Router } from "express";
import {
  getPublicProviders,
  getPublicSlots,
  postBookingRequest,
  getMyBookingRequest,
  patchMyBookingRequest,
  deleteMyBookingRequest,
  postVerifyBookingRequest,
  postResendVerificationCode,
  postDocumentRequest,
  getMyDocumentRequest,
  deleteMyDocumentRequest,
  postVerifyDocumentRequest,
  postResendDocumentRequestCode,
  getMyDocumentRequestFile,
} from "./public.controller.js";
import {
  getMyPatientDocuments,
  postMyPatientDocument,
  getMyPatientDocumentFile,
} from "../patientDocuments/patientDocuments.controller.js";
import { documentUpload, handleUploadErrors } from "../lib/uploads.js";

const router = Router();

router.get("/providers", getPublicProviders);
router.get("/providers/:providerId/slots", getPublicSlots);
router.post("/booking-requests", postBookingRequest);
router.get("/booking-requests/:id", getMyBookingRequest);
router.patch("/booking-requests/:id", patchMyBookingRequest);
router.delete("/booking-requests/:id", deleteMyBookingRequest);
router.post("/booking-requests/:id/verify", postVerifyBookingRequest);
router.post("/booking-requests/:id/resend-code", postResendVerificationCode);
router.post("/document-requests", postDocumentRequest);
router.get("/document-requests/:id", getMyDocumentRequest);
router.delete("/document-requests/:id", deleteMyDocumentRequest);
router.post("/document-requests/:id/verify", postVerifyDocumentRequest);
router.post("/document-requests/:id/resend-code", postResendDocumentRequestCode);
router.get("/document-requests/:id/file", getMyDocumentRequestFile);

// Patient document uploads, scoped to the patient behind a booking link —
// proven via the same access token as the rest of that booking's endpoints.
router.get("/booking-requests/:id/documents", getMyPatientDocuments);
router.post(
  "/booking-requests/:id/documents",
  documentUpload.single("file"),
  handleUploadErrors,
  postMyPatientDocument
);
router.get("/booking-requests/:id/documents/:docId/file", getMyPatientDocumentFile);

export default router;
