import assert from "node:assert/strict";
import { analyticsConfig } from "../lib/analytics-config.js";
const keys = ["NODE_ENV", "ANALYTICS_QA_MEASUREMENT_ID", "GA4_MEASUREMENT_ID", "ANALYTICS_ENABLED", "ANALYTICS_LOCAL_TEST"];
const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
try {
  process.env.NODE_ENV = "development";
  process.env.ANALYTICS_ENABLED = "true";
  process.env.GA4_MEASUREMENT_ID = "G-V56ZM6JDDD";
  process.env.ANALYTICS_QA_MEASUREMENT_ID = "G-V56ZM6JDDD";
  assert.equal(analyticsConfig().enabled, false);
  process.env.ANALYTICS_QA_MEASUREMENT_ID = "G-RH4SHPZS5E";
  assert.equal(analyticsConfig().id, "G-RH4SHPZS5E"); assert.equal(analyticsConfig().qa, true);
  process.env.NODE_ENV = "production";
  assert.equal(analyticsConfig().qa, false); assert.equal(analyticsConfig().id, "G-V56ZM6JDDD");
  process.env.ANALYTICS_ENABLED = "false";
  assert.equal(analyticsConfig().enabled, false);
  console.log("4 analytics environment-isolation checks passed. No provider requests.");
} finally {
  for (const key of keys) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
}
