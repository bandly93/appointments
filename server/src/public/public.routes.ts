import { Router } from "express";
import {
  getPublicConfig,
  getPublicProviders,
  getPublicSlots,
  postBookingRequest,
  getMyBookingRequest,
  patchMyBookingRequest,
  deleteMyBookingRequest,
  postVerifyBookingRequest,
  postResendVerificationEmail,
  postDocumentRequest,
  getMyDocumentRequest,
  deleteMyDocumentRequest,
  postVerifyDocumentRequest,
  postResendDocumentRequestCode,
  getMyDocumentRequestFile,
} from "./public.controller.js";
import {
  getMyPatientDocuments,
  getMyPatientDocumentFile,
} from "../patientDocuments/patientDocuments.controller.js";

const router = Router();

router.get("/config", getPublicConfig);
router.get("/providers", getPublicProviders);
router.get("/providers/:providerId/slots", getPublicSlots);
router.post("/booking-requests", postBookingRequest);
router.get("/booking-requests/:id", getMyBookingRequest);
router.patch("/booking-requests/:id", patchMyBookingRequest);
router.delete("/booking-requests/:id", deleteMyBookingRequest);
router.post("/booking-requests/:id/verify", postVerifyBookingRequest);
router.post("/booking-requests/:id/resend-email", postResendVerificationEmail);
router.post("/document-requests", postDocumentRequest);
router.get("/document-requests/:id", getMyDocumentRequest);
router.delete("/document-requests/:id", deleteMyDocumentRequest);
router.post("/document-requests/:id/verify", postVerifyDocumentRequest);
router.post("/document-requests/:id/resend-code", postResendDocumentRequestCode);
router.get("/document-requests/:id/file", getMyDocumentRequestFile);

// Patients can view/download documents staff have shared with them, scoped
// to the patient behind a booking link — proven via the same access token as
// the rest of that booking's endpoints.
router.get("/booking-requests/:id/documents", getMyPatientDocuments);
router.get("/booking-requests/:id/documents/:docId/file", getMyPatientDocumentFile);

export default router;
