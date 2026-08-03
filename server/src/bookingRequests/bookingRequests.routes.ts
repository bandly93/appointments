import { Router } from "express";
import {
  getBookingRequests,
  patchBookingRequest,
  postApprove,
  postReject,
  deleteBookingRequestHandler,
  postStaffBooking,
} from "./bookingRequests.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("STAFF", "ADMIN", "PROVIDER"), getBookingRequests);
// Staff/provider booking on a patient's behalf directly (phone, walk-in,
// whatever the channel) — the service limits providers to their own
// schedule, same as approve/reject.
router.post("/staff", requireRole("STAFF", "ADMIN", "PROVIDER"), postStaffBooking);
router.patch("/:id", requireRole("STAFF", "ADMIN"), patchBookingRequest);
// Providers may decide requests too — the service limits them to their own schedule.
router.post("/:id/approve", requireRole("STAFF", "ADMIN", "PROVIDER"), postApprove);
router.post("/:id/reject", requireRole("STAFF", "ADMIN", "PROVIDER"), postReject);
router.delete("/:id", requireRole("STAFF", "ADMIN"), deleteBookingRequestHandler);

export default router;
