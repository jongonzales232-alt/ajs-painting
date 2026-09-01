const publicDefaults = {
  phone: "(254) 205-0950",
  secondaryPhone: "(254) 715-8043",
  email: "ajspaintingcontractor@gmail.com",
  serviceArea: "Waco, Hillsboro, Whitney, Central Texas, and the DFW area",
  insurance: {
    status: "pending",
    headline: "Coverage",
    detail: "General liability coverage being finalized"
  }
};

export function getBusinessDetails() {
  return publicDefaults;
}
