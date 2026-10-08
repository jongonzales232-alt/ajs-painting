export function analyticsConfig() {
  // Approved separate test property. This switch can never enable production IDs on localhost.
  const qa = process.env.NODE_ENV !== "production" && process.env.ANALYTICS_QA_MEASUREMENT_ID === "G-RH4SHPZS5E";
  const id = qa ? "G-RH4SHPZS5E" : process.env.GA4_MEASUREMENT_ID || "";
  const test = !qa && process.env.NODE_ENV !== "production" && process.env.ANALYTICS_LOCAL_TEST === "1";
  return {
    enabled: qa || (process.env.NODE_ENV === "production" && process.env.ANALYTICS_ENABLED === "true" && /^G-[A-Z0-9]+$/.test(id)),
    test, qa, id
  };
}
