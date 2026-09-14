"use client";

import { useState } from "react";

export default function ScheduleForm({ slots }) {
  const [available, setAvailable] = useState(slots);
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const dates = [...new Map(available.map((slot) => [slot.date, slot.dateLabel])).entries()];
  const chosen = available.find((slot) => `${slot.startsAt}|${slot.endsAt}` === selected);

  async function refreshTimes() {
    const response = await fetch("/api/schedule", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not refresh appointment times. Please try again.");
    const result = await response.json();
    setAvailable(result.slots);
    setDate("");
    setSelected("");
  }

  async function submit(event) {
    event.preventDefault();
    if (loading || booking) return;
    const formData = new FormData(event.currentTarget);
    const appointmentLabel = chosen ? `${chosen.dateLabel}, ${chosen.timeLabel}` : "";
    setLoading(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/schedule", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        let message = result.error || "That appointment could not be booked.";
        if (response.status === 409) {
          try { await refreshTimes(); message += " Available times have been refreshed; your contact details are still here."; }
          catch { message += " Please refresh the page to see current availability."; }
        }
        setStatus({ type: "error", text: message });
        return;
      }
      setBooking({
        id: result.id, when: result.when || appointmentLabel, address: formData.get("address"),
        emailed: Boolean(result.email?.customer?.sent && result.email?.owner?.sent)
      });
    } catch {
      setStatus({ type: "error", text: "We could not confirm the booking. Check your email or call us before trying again, so you do not book twice." });
    } finally { setLoading(false); }
  }

  if (booking) return (
    <div className="form-card" role="status" aria-live="polite">
      <div className="form-heading"><h2>Your estimate is booked</h2><p>Keep these details for your visit.</p></div>
      <div className="booking-summary"><strong>{booking.when}</strong><p>{booking.address}</p><p>Booking reference: {booking.id}</p></div>
      <p>{booking.emailed ? "A confirmation and calendar invitation have been emailed to you." : "Your appointment is saved, but email confirmation is delayed. Please save these details; you do not need to book again."}</p>
      <p>Need to change or cancel? <a href="/contact">Contact AJ&apos;s Painting</a>.</p>
    </div>
  );

  return (
    <form className="form-card" onSubmit={submit} aria-busy={loading}>
      <fieldset className="schedule-fields" disabled={loading}>
        <div className="form-heading">
          <h2>Choose your visit</h2>
          <p>Times are in Central Time (CST/CDT). Submitting books the appointment. Fields marked * are required.</p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="appointmentDate">Available date *</label>
            <select id="appointmentDate" required value={date} onChange={(event) => { setDate(event.target.value); setSelected(""); }}>
              <option value="">Choose a date</option>
              {dates.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="slot">Available time (Central) *</label>
            <select id="slot" name="slot" required value={selected} disabled={!date} onChange={(event) => setSelected(event.target.value)}>
              <option value="">{date ? "Choose a time" : "Choose a date first"}</option>
              {available.filter((slot) => slot.date === date).map((slot) => (
                <option key={slot.startsAt} value={`${slot.startsAt}|${slot.endsAt}`}>{slot.timeLabel}</option>
              ))}
            </select>
          </div>
          {chosen && <div className="booking-summary field full"><strong>{chosen.dateLabel}</strong><span>{chosen.timeLabel} · Free on-site estimate</span></div>}
          <div className="field"><label htmlFor="fullName">Full name *</label><input id="fullName" name="fullName" required maxLength={120} autoComplete="name" /></div>
          <div className="field"><label htmlFor="phone">Phone number *</label><input id="phone" name="phone" type="tel" required maxLength={25} autoComplete="tel" /></div>
          <div className="field"><label htmlFor="email">Email *</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
          <div className="field"><label htmlFor="address">Full job address *</label><input id="address" name="address" required maxLength={220} autoComplete="street-address" aria-describedby="visit-address-help" /><small id="visit-address-help">Include street, town, and ZIP so we can find you.</small></div>
          <div className="field full"><label htmlFor="notes">Project or access notes (optional)</label><textarea id="notes" name="notes" maxLength={1000} placeholder="What would you like painted? Any gate codes or access instructions?" /></div>
        </div>
        <div className="actions" style={{ marginTop: 18 }}><button className="button" disabled={loading || !chosen} type="submit">{loading ? "Booking..." : "Book My Free Estimate"}</button></div>
      </fieldset>
      {available.length === 0 && <div className="status-message" role="status">No times are open right now. <a href="/quote">Request a quote</a> or <a href="/contact">contact us</a> to arrange a visit.</div>}
      {status.text && <div className={`status-message ${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.text}</div>}
    </form>
  );
}
