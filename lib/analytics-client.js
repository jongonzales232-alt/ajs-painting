export function trackFormStart(formType) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ajs-business-event", { detail: { name: "form_start", form_type: formType } }));
}
export function trackLead(formType, submissionId, serviceType = "") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ajs-business-event", { detail: { name: "generate_lead", form_type: formType, submissionId, serviceType } }));
}
