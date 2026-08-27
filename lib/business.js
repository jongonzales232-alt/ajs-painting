const placeholderPhones = new Set(["(555) 555-5555", "555-555-5555"]);
const placeholderEmails = new Set(["info@ajspainting.com"]);
const placeholderAreas = new Set(["Your city and surrounding areas"]);

const publicDefaults = {
  phone: "(254) 205-0950",
  secondaryPhone: "(254) 715-8043",
  email: "ajspaintingcontractor@gmail.com",
  serviceArea: "Waco, Hillsboro, Whitney, Central Texas, and the DFW area"
};

function configured(value, placeholders) {
  const clean = String(value || "").trim();
  return clean && !placeholders.has(clean) ? clean : null;
}

export function getBusinessDetails() {
  return {
    phone: configured(process.env.BUSINESS_PHONE, placeholderPhones) || publicDefaults.phone,
    secondaryPhone: configured(process.env.BUSINESS_PHONE_SECONDARY, placeholderPhones) || publicDefaults.secondaryPhone,
    email: configured(process.env.BUSINESS_EMAIL, placeholderEmails) || publicDefaults.email,
    serviceArea: configured(process.env.SERVICE_AREA, placeholderAreas) || publicDefaults.serviceArea
  };
}
