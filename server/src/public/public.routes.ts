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
} from "./public.controller.js";

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

export default router;
