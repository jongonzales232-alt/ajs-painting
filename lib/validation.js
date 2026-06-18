const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\-\s.\d]{7,25}$/;

export function clean(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

export function requireText(value, label, maxLength = 500) {
  const text = clean(value, maxLength);
  if (!text) throw new Error(`${label} is required.`);
  return text;
}

export function requireEmail(value) {
  const email = requireText(value, "Email", 254).toLowerCase();
  if (!emailPattern.test(email)) throw new Error("Please enter a valid email address.");
  return email;
}

export function requirePhone(value) {
  const phone = requireText(value, "Phone number", 25);
  const digits = phone.replace(/\D/g, "");
  if (!phonePattern.test(phone) || digits.length < 7 || digits.length > 15) {
    throw new Error("Please enter a valid phone number.");
  }
  return phone;
}

export function requireEnum(value, allowed, label) {
  const text = requireText(value, label, 50);
  if (!allowed.includes(text)) throw new Error(`Please choose a valid ${label.toLowerCase()}.`);
  return text;
}

export function optionalDate(value, label) {
  const text = clean(value, 30);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error(`Please enter a valid ${label.toLowerCase()}.`);
  return date;
}
