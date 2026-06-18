import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const required = [
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "SESSION_SECRET",
  "BUSINESS_OWNER_EMAIL",
  "BUSINESS_PHONE",
  "BUSINESS_EMAIL",
  "SERVICE_AREA",
  "BUSINESS_TIME_ZONE",
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM"
];

const weakValues = new Set([
  "",
  "admin",
  "admin123",
  "change-this-password",
  "change-this-long-random-secret",
  "local-development-session-secret-change-before-production",
  "owner@example.com",
  "info@ajspainting.com",
  "http://localhost:3000"
]);

const failures = [];
const warnings = [];

for (const key of required) {
  const value = process.env[key] || "";
  if (!value) failures.push(`${key} is missing.`);
  if (weakValues.has(value)) failures.push(`${key} is still set to a placeholder/development value.`);
}

if ((process.env.ADMIN_PASSWORD || "").length < 14) {
  failures.push("ADMIN_PASSWORD should be at least 14 characters.");
}

if ((process.env.SESSION_SECRET || "").length < 32) {
  failures.push("SESSION_SECRET should be at least 32 characters.");
}

if ((process.env.DATABASE_URL || "").startsWith("file:")) {
  warnings.push("DATABASE_URL uses local SQLite. Use hosted Postgres for durable production hosting.");
}

if (!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")) {
  failures.push("NEXT_PUBLIC_SITE_URL should be the final HTTPS production URL.");
}

if (!process.env.EMAIL_FROM?.includes("@")) {
  failures.push("EMAIL_FROM should be a verified sender address.");
}

if (warnings.length) {
  console.warn("Launch warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error("Launch preflight failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Launch preflight passed.");
