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

router.use(requireAuth);
router.get("/", requireRole("STAFF", "ADMIN", "PROVIDER"), getBookingRequests);
router.patch("/:id", requireRole("STAFF", "ADMIN"), patchBookingRequest);
// Providers may decide requests too — the service limits them to their own schedule.
router.post("/:id/approve", requireRole("STAFF", "ADMIN", "PROVIDER"), postApprove);
router.post("/:id/reject", requireRole("STAFF", "ADMIN", "PROVIDER"), postReject);
router.delete("/:id", requireRole("STAFF", "ADMIN"), deleteBookingRequestHandler);

export default router;
