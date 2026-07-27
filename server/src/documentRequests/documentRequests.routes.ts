import { Router } from "express";
import { getDocumentRequests, postFulfill, postDecline } from "./documentRequests.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("STAFF", "ADMIN"));
router.get("/", getDocumentRequests);
router.post("/:id/fulfill", postFulfill);
router.post("/:id/decline", postDecline);

export default router;
