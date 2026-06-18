"use client";

import { useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    setLoading(false);
    if (response.ok) {
      window.location.href = "/admin";
    } else {
      setError("Invalid password.");
    }
  }

  return (
    <form className="form-card" onSubmit={submit} style={{ maxWidth: 440, margin: "80px auto" }}>
      <h1>Admin Login</h1>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button className="button" style={{ marginTop: 18 }} disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign In"}
      </button>
      {error ? <p className="status-message error">{error}</p> : null}
    </form>
  );
}
