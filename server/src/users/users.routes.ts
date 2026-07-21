import { Router } from "express";
import { getUsers, postUser } from "./users.controller.js";
import { requireAuth, requireAdmin } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", getUsers);
router.post("/", postUser);

export default router;
