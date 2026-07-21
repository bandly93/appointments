// src/config/env.ts
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (!jwtAccessSecret) {
  throw new Error("JWT_ACCESS_SECRET is required");
}

if (!jwtRefreshSecret) {
  throw new Error("JWT_REFRESH_SECRET is required");
}

export const env = {
  DATABASE_URL: databaseUrl,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  JWT_ACCESS_SECRET: jwtAccessSecret,
  JWT_REFRESH_SECRET: jwtRefreshSecret,
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL ?? "7d",
};