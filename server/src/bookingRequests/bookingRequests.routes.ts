import { Router } from "express";
import {
  getBookingRequests,
  patchBookingRequest,
  postApprove,
  postReject,
  deleteBookingRequestHandler,
} from "./bookingRequests.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("STAFF", "ADMIN"));
router.get("/", getBookingRequests);
router.patch("/:id", patchBookingRequest);
router.post("/:id/approve", postApprove);
router.post("/:id/reject", postReject);
router.delete("/:id", deleteBookingRequestHandler);

export default router;
