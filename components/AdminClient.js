"use client";

import { useMemo, useState } from "react";
import SafeImage from "./SafeImage";

const statuses = ["NEW", "CONTACTED", "SCHEDULED", "QUOTED", "WON", "LOST", "COMPLETED"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminClient({ initialLeads, appointments, galleryPhotos, availability, blockedDays, stats, timeZone }) {
  const [leads, setLeads] = useState(initialLeads);
  const [photos, setPhotos] = useState(galleryPhotos);
  const [slots, setSlots] = useState(availability);
  const [blocks, setBlocks] = useState(blockedDays);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const filteredLeads = useMemo(() => {
    const term = query.toLowerCase();
    return leads.filter((lead) =>
      [lead.fullName, lead.phone, lead.email, lead.address, lead.status, lead.projectType].join(" ").toLowerCase().includes(term)
    );
  }, [leads, query]);

  async function updateLead(leadId, body) {
    const response = await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, ...body })
    });
    const result = await response.json();
    if (response.ok) {
      setLeads((current) => current.map((lead) => (lead.id === leadId ? result.lead : lead)));
      setMessage("Lead updated.");
    } else {
      setMessage(result.error || "Could not update lead.");
    }
  }

  async function addFollowUpNote(event, leadId) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const followUpNote = String(formData.get("followUpNote") || "").trim();
    if (!followUpNote) return;
    await updateLead(leadId, { followUpNote });
    event.currentTarget.reset();
  }

  async function uploadGallery(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/gallery", { method: "POST", body: formData });
    const result = await response.json();
    if (response.ok) {
      setPhotos((current) => [result.photo, ...current]);
      event.currentTarget.reset();
      setMessage("Gallery photo uploaded.");
    } else {
      setMessage(result.error || "Upload failed.");
    }
  }

  async function deletePhoto(photoId) {
    const response = await fetch(`/api/admin/gallery?id=${photoId}`, { method: "DELETE" });
    if (response.ok) {
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
      setMessage("Gallery photo deleted.");
    }
  }

  async function addAvailability(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "slot", ...body })
    });
    const result = await response.json();
    if (response.ok) {
      setSlots((current) => [...current, result.slot].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)));
      event.currentTarget.reset();
      setMessage("Availability added.");
    }
  }

  async function updateAvailability(event, slotId) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: slotId, type: "slot", ...body })
    });
    const result = await response.json();
    if (response.ok) {
      setSlots((current) =>
        current
          .map((slot) => (slot.id === slotId ? result.slot : slot))
          .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
      );
      setMessage("Availability updated.");
    } else {
      setMessage(result.error || "Could not update availability.");
    }
  }

  async function addBlockedDay(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "block", ...body })
    });
    const result = await response.json();
    if (response.ok) {
      setBlocks((current) => [result.blockedDay, ...current]);
      event.currentTarget.reset();
      setMessage("Unavailable day blocked off.");
    }
  }

  async function removeAvailability(id, type) {
    const response = await fetch(`/api/admin/availability?id=${id}&type=${type}`, { method: "DELETE" });
    if (response.ok && type === "slot") setSlots((current) => current.filter((slot) => slot.id !== id));
    if (response.ok && type === "block") setBlocks((current) => current.filter((day) => day.id !== id));
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand" style={{ marginBottom: 24 }}>
          <span className="brand-mark">AJ</span>
          <span>Admin</span>
        </div>
        <a href="#leads">Leads</a>
        <a href="#appointments">Appointments</a>
        <a href="#gallery">Gallery</a>
        <a href="#availability">Availability</a>
        <button onClick={logout}>Log out</button>
      </aside>
      <main className="admin-main">
        <h1>AJ&apos;s Painting Dashboard</h1>
        {message ? <p className="status-message success">{message}</p> : null}
        <section className="stats" aria-label="Dashboard stats">
          <div className="stat"><strong>{stats.newLeads}</strong><span>New leads</span></div>
          <div className="stat"><strong>{stats.upcomingAppointments}</strong><span>Upcoming appointments</span></div>
          <div className="stat"><strong>{stats.completedJobs}</strong><span>Completed jobs</span></div>
          <div className="stat"><strong>{stats.wonJobs}</strong><span>Won jobs</span></div>
        </section>

        <section id="leads" className="admin-panel" style={{ marginTop: 22 }}>
          <div className="toolbar">
            <h2>Quote Requests</h2>
            <input aria-label="Search leads" placeholder="Search name, phone, address, or status" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.fullName}</strong><br />
                      {lead.phone}<br />{lead.email}<br />{lead.address}
                    </td>
                    <td>{lead.projectType}<br />{lead.surface}<br />{lead.projectSize}</td>
                    <td>
                      <select value={lead.status} onChange={(event) => updateLead(lead.id, { status: event.target.value })}>
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </td>
                    <td>
                      <textarea defaultValue={lead.adminNotes || ""} onBlur={(event) => updateLead(lead.id, { adminNotes: event.target.value })} />
                      <small>{lead.description}</small>
                      <form onSubmit={(event) => addFollowUpNote(event, lead.id)} style={{ marginTop: 10 }}>
                        <input name="followUpNote" placeholder="Add follow-up note" />
                        <button className="button-light" type="submit" style={{ marginTop: 8 }}>Add Note</button>
                      </form>
                      {lead.followUpNotes?.length ? (
                        <small>
                          Latest note: {lead.followUpNotes[lead.followUpNotes.length - 1].note}
                        </small>
                      ) : null}
                    </td>
                    <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="appointments" className="admin-panel" style={{ marginTop: 22 }}>
          <h2>Scheduled Estimates</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Customer</th><th>Address</th><th>Notes</th></tr></thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{new Date(appointment.startsAt).toLocaleString("en-US", { timeZone })}</td>
                    <td><strong>{appointment.fullName}</strong><br />{appointment.phone}<br />{appointment.email}</td>
                    <td>{appointment.address}</td>
                    <td>{appointment.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-grid" style={{ marginTop: 22 }}>
          <div id="gallery" className="admin-panel">
            <h2>Gallery Photos</h2>
            <form onSubmit={uploadGallery} className="form-grid">
              <div className="field"><label>Title</label><input name="title" /></div>
              <div className="field"><label>Job type</label><input name="jobType" /></div>
              <div className="field"><label>Job date</label><input name="jobDate" type="date" /></div>
              <div className="field"><label>Photo</label><input name="photo" type="file" accept="image/*" required /></div>
              <div className="field full"><label>Description</label><textarea name="description" /></div>
              <button className="button" type="submit">Upload Photo</button>
            </form>
            <div className="gallery-grid" style={{ marginTop: 18 }}>
              {photos.map((photo) => (
                <article className="gallery-card" key={photo.id}>
                  <SafeImage src={photo.url} alt={photo.title || "Gallery photo"} />
                  <div className="gallery-card-body">
                    <h3>{photo.title || "Project photo"}</h3>
                    <button className="button-light" onClick={() => deletePhoto(photo.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div id="availability" className="admin-panel">
            <h2>Availability</h2>
            <form onSubmit={addAvailability} className="form-grid">
              <div className="field full">
                <label>Day</label>
                <select name="weekday" required>{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select>
              </div>
              <div className="field"><label>Start</label><input name="startTime" type="time" required /></div>
              <div className="field"><label>End</label><input name="endTime" type="time" required /></div>
              <button className="button" type="submit">Add Time Slot</button>
            </form>
            <ul>
              {slots.map((slot) => (
                <li key={slot.id}>
                  <form onSubmit={(event) => updateAvailability(event, slot.id)} className="form-grid" style={{ marginBottom: 12 }}>
                    <div className="field full">
                      <label>Day</label>
                      <select name="weekday" defaultValue={slot.weekday} required>{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select>
                    </div>
                    <div className="field"><label>Start</label><input name="startTime" type="time" defaultValue={slot.startTime} required /></div>
                    <div className="field"><label>End</label><input name="endTime" type="time" defaultValue={slot.endTime} required /></div>
                    <button className="button-light" type="submit">Save</button>
                    <button type="button" onClick={() => removeAvailability(slot.id, "slot")}>Remove</button>
                  </form>
                </li>
              ))}
            </ul>
            <h3>Block Off a Day</h3>
            <form onSubmit={addBlockedDay} className="form-grid">
              <div className="field full"><label>Date</label><input name="date" type="date" required /></div>
              <div className="field full"><label>Reason</label><input name="reason" /></div>
              <button className="button-secondary" type="submit">Block Day</button>
            </form>
            <ul>
              {blocks.map((day) => (
                <li key={day.id}>{new Date(day.date).toLocaleDateString()} {day.reason} <button onClick={() => removeAvailability(day.id, "block")}>Remove</button></li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
