"use client";

import { useState } from "react";

export default function QuoteForm() {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setStatus({ type: "", text: "" });

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/quote", { method: "POST", body: formData });
    const result = await response.json();

    setLoading(false);
    if (!response.ok) {
      setStatus({ type: "error", text: result.error || "Please check the form and try again." });
      return;
    }

     event.currentTarget.reset();
    window.alert("Your quote request has been sent. AJ's Painting will get back to you soon.");
    window.location.assign("/");
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" name="phone" required autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="address">Job address</label>
          <input id="address" name="address" required autoComplete="street-address" />
        </div>
        <div className="field">
          <label htmlFor="projectType">Type of project</label>
          <select id="projectType" name="projectType" required>
            <option value="">Choose one</option>
            <option>Interior painting</option>
            <option>Exterior painting</option>
            <option>Cabinet painting</option>
            <option>Fence or deck</option>
            <option>Commercial painting</option>
            <option>Drywall patching and prep</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="surface">Interior/exterior/both</label>
          <select id="surface" name="surface" required>
            <option value="">Choose one</option>
            <option value="INTERIOR">Interior</option>
            <option value="EXTERIOR">Exterior</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="projectSize">Room count or project size</label>
          <input id="projectSize" name="projectSize" required placeholder="Example: 3 rooms, 1,200 sq ft, small deck" />
        </div>
        <div className="field">
          <label htmlFor="preferredStartDate">Preferred start date</label>
          <input id="preferredStartDate" name="preferredStartDate" type="date" />
        </div>
        <div className="field full">
          <label htmlFor="description">Description of work needed</label>
          <textarea id="description" name="description" required />
        </div>
        <div className="field full">
          <label htmlFor="photos">Photos of the job area</label>
          <input id="photos" name="photos" type="file" accept="image/*" multiple />
        </div>
        <div className="field full">
          <label className="check-row">
            <input name="consent" type="checkbox" required />
            <span>I agree to be contacted by AJ&apos;s Painting about this quote request.</span>
          </label>
        </div>
      </div>
      <div className="actions" style={{ marginTop: 18 }}>
        <button className="button" disabled={loading} type="submit">
          {loading ? "Sending..." : "Request a Free Quote"}
        </button>
      </div>
      {status.text ? <div className={`status-message ${status.type}`}>{status.text}</div> : null}
    </form>
  );
}
