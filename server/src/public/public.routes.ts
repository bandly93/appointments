import { Router } from "express";
import {
  getPublicProviders,
  getPublicSlots,
  postBookingRequest,
  getMyBookingRequest,
  patchMyBookingRequest,
  deleteMyBookingRequest,
} from "./public.controller.js";

const router = Router();

router.get("/providers", getPublicProviders);
router.get("/providers/:providerId/slots", getPublicSlots);
router.post("/booking-requests", postBookingRequest);
router.get("/booking-requests/:id", getMyBookingRequest);
router.patch("/booking-requests/:id", patchMyBookingRequest);
router.delete("/booking-requests/:id", deleteMyBookingRequest);

export default router;
