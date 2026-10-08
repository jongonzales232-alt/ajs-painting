"use client";

import { useRef, useState } from "react";
import { trackFormStart, trackLead } from "../lib/analytics-client";

export default function ContactForm() {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    const form = event.currentTarget;
    setStatus({ type: "", text: "" });
    try {
      const formData = new FormData(form);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true || result.email?.sent !== true) {
        setStatus({ type: "error", text: result.error || "Message could not be sent." });
        return;
      }
      trackLead("contact", crypto.randomUUID());
      form.reset();
      setStatus({ type: "success", text: "Message sent. AJ's Painting will follow up soon." });
    } catch {
      setStatus({ type: "error", text: "We could not send your message. Please check your connection and try again." });
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }

  return (
    <form className="form-card" onSubmit={submit} onChange={() => trackFormStart("contact")} data-clarity-mask="true" aria-busy={loading}>
      <div className="form-heading">
        <h2>Send a message</h2>
        <p>Share the basics and we&apos;ll follow up about the best next step.</p>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" />
        </div>
        <div className="field full">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field full">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" required />
        </div>
      </div>
      <div className="actions" style={{ marginTop: 18 }}>
        <button className="button" disabled={loading} type="submit">
          {loading ? "Sending..." : "Send Message"}
        </button>
      </div>
      {status.text ? <div className={`status-message ${status.type}`} role="status" aria-live="polite">{status.text}</div> : null}
    </form>
  );
}
