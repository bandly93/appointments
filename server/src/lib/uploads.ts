// src/lib/uploads.ts
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";

export type StoredFile = { storageKey: string; mimeType: string; originalName: string };

export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "documents");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// Whitelist only — the extension used on disk comes from this map, never
// from the client-supplied filename, so a disguised extension can't matter.
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export class UnsupportedFileTypeError extends Error {
  constructor() {
    super("UNSUPPORTED_FILE_TYPE");
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const extension = ALLOWED_MIME_TYPES[file.mimetype];
    if (!extension) return cb(new UnsupportedFileTypeError(), "");
    // Random, server-generated name: the DB row is the only place the
    // mapping from request to file lives, so the storage key can't be
    // guessed or path-traversed from client input.
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

export const documentUpload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      return cb(new UnsupportedFileTypeError());
    }
    cb(null, true);
  },
});

export function storagePathFor(storageKey: string): string {
  // storageKey always originates from a value this module generated and
  // persisted server-side (see filename() above) — never from a request
  // parameter — so join() here can't be path-traversed.
  return path.join(UPLOADS_DIR, storageKey);
}

export function deleteStoredFile(storageKey: string): void {
  fs.unlink(storagePathFor(storageKey), () => {});
}

// Strips characters that could break or inject into a Content-Disposition header.
export function sanitizeFilenameForHeader(name: string): string {
  return name.replace(/[\r\n"]/g, "").slice(0, 200) || "document";
}

// Shared by every download route. createReadStream emits its 'error' event
// asynchronously (e.g. the DB row survived but the file on disk didn't) —
// with no listener that event is uncaught and crashes the process, so we
// always attach one and fall back to a 404 instead.
export function streamStoredFile(res: Response, file: StoredFile): void {
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${sanitizeFilenameForHeader(file.originalName)}"`);
  const stream = fs.createReadStream(storagePathFor(file.storageKey));
  stream.on("error", () => {
    if (res.headersSent) return res.end();
    res.status(404).json({ error: "File not found" });
  });
  stream.pipe(res);
}

// Shared error middleware for routes using documentUpload.single(...) — must
// be registered directly after the upload middleware in the route chain.
export function handleUploadErrors(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof UnsupportedFileTypeError) {
    return res.status(400).json({ error: "Unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX." });
  }
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: `File too large. Max size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.` });
  }
  next(err);
}
