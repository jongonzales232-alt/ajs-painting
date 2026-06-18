export function businessTimeZone() {
  return process.env.BUSINESS_TIME_ZONE || "America/Chicago";
}

export function formatBusinessDateTime(date, options = {}) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: businessTimeZone(),
    ...options
  });
}
