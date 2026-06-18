"use client";

import { useState } from "react";

export default function ScheduleForm({ slots }) {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setStatus({ type: "", text: "" });

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const result = await response.json();

    setLoading(false);
    if (!response.ok) {
      setStatus({ type: "error", text: result.error || "That appointment could not be booked." });
      return;
    }

    event.currentTarget.reset();
    setStatus({ type: "success", text: "Your estimate appointment is booked. Please check your email for confirmation." });
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="slot">Available appointment time</label>
          <select id="slot" name="slot" required>
            <option value="">Choose a time</option>
            {slots.map((slot) => (
              <option key={slot.startsAt} value={`${slot.startsAt}|${slot.endsAt}`}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" required autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="address">Address</label>
          <input id="address" name="address" required autoComplete="street-address" />
        </div>
        <div className="field full">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" placeholder="Tell us about the project or any access instructions." />
        </div>
      </div>
      <div className="actions" style={{ marginTop: 18 }}>
        <button className="button" disabled={loading || slots.length === 0} type="submit">
          {loading ? "Booking..." : "Schedule an Estimate"}
        </button>
      </div>
      {slots.length === 0 ? <div className="status-message error">No estimate times are available right now. Please request a quote or call directly.</div> : null}
      {status.text ? <div className={`status-message ${status.type}`}>{status.text}</div> : null}
    </form>
  );
}
