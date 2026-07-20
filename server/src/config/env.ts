// src/config/env.ts
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const env = {
  DATABASE_URL: databaseUrl,
  NODE_ENV: process.env.NODE_ENV ?? "development",
};