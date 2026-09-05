import { escapeHtml, nl2br } from "./html";

export function quoteSummary(lead, photoCount) {
  const fields = [
    ["Quote reference", lead.id],
    ["Full name", lead.fullName],
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["Job address", lead.address],
    ["Project type", lead.projectType],
    ["Project area", { INTERIOR: "Interior", EXTERIOR: "Exterior", BOTH: "Both" }[lead.surface]],
    ["Room count or project size", lead.projectSize],
    ["Preferred start date", lead.preferredStartDate ? new Date(lead.preferredStartDate).toISOString().slice(0, 10) : "Not specified"],
    ["Description of work needed", lead.description],
    ["Contact consent", "Agreed"],
    ["Photos", String(photoCount)]
  ];
  return {
    text: fields.map(([label, value]) => `${label}: ${value}`).join("\n\n"),
    html: fields.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong><br>${nl2br(value)}</p>`).join("")
  };
}
