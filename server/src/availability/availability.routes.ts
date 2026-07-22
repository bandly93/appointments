import { Router } from "express";
import { getMyRules, postRule, patchRule, deleteRuleHandler } from "./availability.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("PROVIDER"));
router.get("/mine", getMyRules);
router.post("/", postRule);
router.patch("/:id", patchRule);
router.delete("/:id", deleteRuleHandler);

export default router;
