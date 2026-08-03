import { Router } from "express";
import { getUsers, postUser, postResetPassword } from "./users.controller.js";
import { requireAuth, requireAdmin } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", getUsers);
router.post("/", postUser);
router.post("/:id/reset-password", postResetPassword);

export default router;
