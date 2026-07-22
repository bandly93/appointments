// src/availability/availability.controller.ts
import { Request, Response } from "express";
import { listMyRules, createRule, editRule, removeRule, getBookableSlots } from "./availability.service.js";

export async function getMyRules(req: Request, res: Response) {
  const rules = await listMyRules(req.user!.sub);
  res.json({ success: true, rules });
}

export async function postRule(req: Request, res: Response) {
  try {
    const rule = await createRule(req.user!.sub, req.body);
    res.status(201).json({ success: true, rule });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a valid weekly availability rule" });
    }
    throw err;
  }
}

export async function patchRule(req: Request, res: Response) {
  try {
    const rule = await editRule(req.user!.sub, String(req.params.id), req.body);
    res.json({ success: true, rule });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a valid weekly availability rule" });
    }
    if (err instanceof Error && err.message === "RULE_NOT_FOUND") {
      return res.status(404).json({ error: "Rule not found" });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Forbidden" });
    }
    throw err;
  }
}

export async function deleteRuleHandler(req: Request, res: Response) {
  try {
    await removeRule(req.user!.sub, String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "RULE_NOT_FOUND") {
      return res.status(404).json({ error: "Rule not found" });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Forbidden" });
    }
    throw err;
  }
}

export async function getSlotsHandler(req: Request, res: Response) {
  try {
    const slots = await getBookableSlots(String(req.params.providerId), req.query);
    res.json({ success: true, slots });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Provide valid from/to dates (YYYY-MM-DD)" });
    }
    throw err;
  }
}
