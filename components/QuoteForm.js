"use client";

import { useEffect, useRef, useState } from "react";
import { prepareQuotePhoto } from "../lib/prepare-quote-photo";
import { MAX_QUOTE_PHOTOS } from "../lib/quote-photos";
import { PROJECT_TYPES, PROJECT_SURFACES } from "../lib/quote-fields";

export default function QuoteForm() {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [preparing, setPreparing] = useState(false);
  const [projectType, setProjectType] = useState("");
  const busy = useRef(false);
  const photoInput = useRef(null);
  const previews = useRef(new Set());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function addPhotos(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (busy.current || !selected.length) return;
    if (photos.length + selected.length > MAX_QUOTE_PHOTOS) {
      setStatus({ type: "error", text: `You can add up to ${MAX_QUOTE_PHOTOS} photos. Your current photos are still selected.` });
      return;
    }
    busy.current = true;
    setPreparing(true);
    const added = [];
    const errors = [];
    try {
      for (let index = 0; index < selected.length; index++) {
        setStatus({ type: "", text: `Preparing photo ${index + 1} of ${selected.length}...` });
        try {
          const file = await prepareQuotePhoto(selected[index]);
          const url = URL.createObjectURL(file);
          previews.current.add(url);
          added.push({ file, url });
        } catch (error) {
          errors.push(error.message);
        }
      }
      setPhotos((current) => [...current, ...added]);
      setStatus({ type: errors.length ? "error" : "", text: errors.length ? errors.join(" ") : `${photos.length + added.length} photos ready to send.` });
    } finally {
      busy.current = false;
      setPreparing(false);
    }
  }

  function removePhoto(url) {
    URL.revokeObjectURL(url);
    previews.current.delete(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
    setStatus({ type: "", text: "" });
  }

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;

    const form = event.currentTarget;
    busy.current = true;
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const formData = new FormData(form);
      formData.delete("photos");
      photos.forEach(({ file }) => formData.append("photos", file));
      const response = await fetch("/api/quote", { method: "POST", body: formData });
      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        setStatus({ type: "error", text: result.error || (response.status === 413 ? "These photos are too large to send together. Remove a few photos and try again." : "Please check the form and try again.") });
        return;
      }

      form.reset();
      window.location.href = result.email?.owner?.sent && result.email?.customer?.sent ? "/thank-you" : "/thank-you?email=delayed";
    } catch {
      setStatus({ type: "error", text: "We could not send your request. Please check your connection and try again." });
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }

  return (
    <form className="form-card" onSubmit={submit} aria-busy={loading || preparing}>
      <fieldset disabled={loading} className="quote-fields">
      <div className="form-heading">
        <h2>Project details</h2>
        <p>Start with the basics. Fields marked * are required; photos and extra details are optional.</p>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="fullName">Full name *</label>
          <input id="fullName" name="fullName" required maxLength={120} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number *</label>
          <input id="phone" name="phone" type="tel" required maxLength={25} autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="address">Project town or ZIP code *</label>
          <input id="address" name="address" required maxLength={220} autoComplete="address-level2" placeholder="For example: Waco or 76701" aria-describedby="location-help" />
          <small id="location-help">No street address needed yet. We&apos;ll confirm it before an on-site visit.</small>
        </div>
        <div className="field">
          <label htmlFor="projectType">Type of project *</label>
          <select id="projectType" name="projectType" required value={projectType} onChange={(event) => setProjectType(event.target.value)}>
            <option value="">Choose one</option>
            {PROJECT_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>
        {projectType && !PROJECT_SURFACES[projectType] ? <div className="field">
          <label htmlFor="surface">Where is the work? (optional)</label>
          <select key={projectType} id="surface" name="surface" defaultValue="UNKNOWN">
            <option value="UNKNOWN">Not sure yet</option>
            <option value="INTERIOR">Interior</option>
            <option value="EXTERIOR">Exterior</option>
            <option value="BOTH">Both</option>
          </select>
        </div> : <input type="hidden" name="surface" value={PROJECT_SURFACES[projectType] || "UNKNOWN"} />}
        <div className="field">
          <label htmlFor="projectSize">Project size (optional)</label>
          <input id="projectSize" name="projectSize" maxLength={120} placeholder="3 rooms, a small deck, or not sure yet" />
        </div>
        <div className="field">
          <label htmlFor="preferredStartDate">Preferred start date (optional)</label>
          <input id="preferredStartDate" name="preferredStartDate" type="date" />
        </div>
        <div className="field full">
          <label htmlFor="description">What would you like painted? *</label>
          <textarea id="description" name="description" required maxLength={10000} aria-describedby="description-help" />
          <small id="description-help">A sentence or two is enough to get started. Add more detail if you like.</small>
        </div>
        <div className="field full">
          <label htmlFor="photos">Photos of the job area (optional)</label>
          <input ref={photoInput} id="photos" type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif" multiple onChange={addPhotos} disabled={preparing || photos.length >= MAX_QUOTE_PHOTOS} />
          <button className="button-light" type="button" onClick={() => photoInput.current?.click()} disabled={preparing || photos.length >= MAX_QUOTE_PHOTOS} aria-describedby="photos-help">
            {preparing ? "Preparing photos..." : photos.length ? "Add more photos" : "Choose photos"}
          </button>
          <small id="photos-help">Add up to 20 photos, all at once or a few at a time. JPG, PNG, WebP, GIF, and iPhone HEIC/HEIF supported, up to 25 MB each. We convert and resize photos on your device before sending.</small>
          <p aria-live="polite">{photos.length} of {MAX_QUOTE_PHOTOS} photos selected</p>
          {photos.length > 0 && <ul className="quote-photo-list">
            {photos.map(({ file, url }) => <li key={url}>
              {/* Local object URLs cannot use Next image optimization. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Selected photo: ${file.name}`} />
              <span>{file.name}<small>{Math.ceil(file.size / 1024)} KB · Ready</small></span>
              <button type="button" className="button-light" disabled={preparing} onClick={() => removePhoto(url)} aria-label={`Remove ${file.name}`}>Remove</button>
            </li>)}
          </ul>}
        </div>
        <div className="field full">
          <label className="check-row">
            <input name="consent" type="checkbox" required />
            <span>I agree to be contacted by AJ&apos;s Painting about this quote request. *</span>
          </label>
        </div>
      </div>
      <div className="actions" style={{ marginTop: 18 }}>
        <button className="button" disabled={loading || preparing} type="submit">
          {preparing ? "Preparing photos..." : loading ? "Sending..." : "Request a Free Quote"}
        </button>
      </div>
      </fieldset>
      {status.text ? <div className={`status-message ${status.type}`} role="status" aria-live="polite">{status.text}</div> : null}
    </form>
  );
}
