"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CONSENT_KEY, browserConsent, publicPath, safeReferrer, cleanEvent, serviceLabel, engagementClock } from "../lib/analytics-policy.mjs";

export default function AnalyticsConsent({ enabled, test, qa = false }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const engine = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    setChoice(browserConsent());
    const click = (event) => { const button = event.target.closest?.("[data-privacy-settings]"); if (button) { trigger.current = button; setOpen(true); } };
    const sync = (event) => { if (event.key === CONSENT_KEY || event.key === null) { const next = browserConsent(); if (next !== "accepted") engine.current?.stop(); setChoice(next); } };
    document.addEventListener("click", click);
    window.addEventListener("storage", sync);
    return () => { document.removeEventListener("click", click); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => { if (open) panel.current?.focus(); }, [open]);

  useEffect(() => {
    const allowedHost = test || qa ? ["localhost", "127.0.0.1"].includes(location.hostname) : ["ajspaintingtx.com", "www.ajspaintingtx.com"].includes(location.hostname);
    if (choice !== "accepted" || browserConsent() !== "accepted" || (!enabled && !test) || !allowedHost) return;
    let frame = null, ready = false, queue = [], lastPath = null, sequence = 0;
    const starts = new Set(), leads = new Set();
    const referrer = safeReferrer(document.referrer);
    const clock = engagementClock(Date.now());
    let engagedOnPage = false;
    function sample() {
      const focused = Boolean(document.hasFocus?.());
      clock.sample(Boolean(frame && document.visibilityState === "visible" && focused && browserConsent() === "accepted"), Date.now());
      if (qa && frame) frame.dataset.qaEngagement = JSON.stringify({ focused, visibility: document.visibilityState, elapsed: clock.amount() });
    }
    function stop() {
      // No cookieless denial ping: dispose the vendor's execution context.
      try { frame?.contentWindow?.ajsStopAnalytics?.(); } catch { /* Frame has already navigated/unloaded. */ }
      frame?.remove(); frame = null; ready = false; queue = []; lastPath = null;
      clock.reset(Date.now());
    }
    function send(name, extra = {}, path = location.pathname) {
      if (browserConsent() !== "accepted") { stop(); return false; }
      sample();
      const event = cleanEvent(name, path, extra);
      if (!event || !frame) return false;
      if (name !== "page_view") { const elapsed = clock.take(); if (elapsed) event.params.engagement_time_msec = Math.min(1800000, elapsed); }
      const message = { type: "ajs-analytics-event", sequence: ++sequence, event, referrer };
      if (ready) frame.contentWindow?.postMessage(message, location.origin);
      else if (queue.length < 50) queue.push(message);
      return true;
    }
    function route() {
      const path = publicPath(location.pathname);
      if (!path) { stop(); return; }
      if (lastPath && path !== lastPath) flushEngagement();
      if (!frame) {
        frame = document.createElement("iframe");
        frame.hidden = true; frame.title = "Consented analytics";
        frame.setAttribute("aria-hidden", "true"); frame.tabIndex = -1;
        frame.referrerPolicy = "no-referrer"; frame.src = "/analytics/frame";
        document.body.appendChild(frame);
      }
      if (path !== lastPath) { lastPath = path; starts.clear(); engagedOnPage = false; send("page_view"); }
    }
    function flushEngagement() { sample(); if (lastPath && clock.amount() > 0) send("site_engagement", {}, lastPath); }
    function onMessage(message) {
      if (!frame || message.source !== frame.contentWindow || message.origin !== location.origin || browserConsent() !== "accepted") return;
      if (message.data?.type === "ajs-analytics-ready") {
        ready = true;
        queue.splice(0).forEach((entry) => frame.contentWindow?.postMessage(entry, location.origin));
      }
      if (test && message.data?.type === "ajs-analytics-test") setEvents((current) => [...current.slice(-49), message.data.event]);
    }
    function action(event) {
      const data = event.detail || {};
      if (data.name === "form_start") {
        const key = `${location.pathname}:${data.form_type}`;
        if (!starts.has(key) && send("form_start", data)) starts.add(key);
      }
      if (data.name === "generate_lead" && typeof data.submissionId === "string" && data.submissionId) {
        // Deduplication ID stays only in memory, never in GA payloads/storage.
        const key = `${data.form_type}:${data.submissionId}`;
        if (!leads.has(key) && send("generate_lead", { form_type: data.form_type, service_type: serviceLabel(data.serviceType) })) leads.add(key);
      }
    }
    function click(event) {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("tel:")) send("phone_click");
      else if (href.startsWith("mailto:")) send("email_click");
      else {
        const target = new URL(href, location.origin);
        if (target.origin === location.origin && ["/quote", "/schedule"].includes(target.pathname)) send("estimate_click", { destination: target.pathname });
        if (target.origin === location.origin && !publicPath(target.pathname)) stop();
      }
    }
    window.addEventListener("message", onMessage);
    window.addEventListener("ajs-business-event", action);
    document.addEventListener("click", click, true);
    // The blank iframe never has focus, so measure only the actual public document's
    // foreground time. Flush on actions/transitions and once at ten seconds per page.
    // No repeating network heartbeat that would keep an idle session alive.
    document.addEventListener("visibilitychange", flushEngagement);
    window.addEventListener("blur", flushEngagement);
    window.addEventListener("focus", sample);
    window.addEventListener("pagehide", flushEngagement);
    const consentTimer = setInterval(() => {
      if (browserConsent() !== "accepted") { stop(); setChoice(null); return; }
      sample();
      if (!engagedOnPage && clock.amount() >= 10000) { engagedOnPage = true; flushEngagement(); }
    }, 1000);
    engine.current = { stop, route };
    route();
    return () => {
      stop(); engine.current = null;
      clearInterval(consentTimer);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("ajs-business-event", action);
      document.removeEventListener("click", click, true);
      document.removeEventListener("visibilitychange", flushEngagement);
      window.removeEventListener("blur", flushEngagement);
      window.removeEventListener("focus", sample);
      window.removeEventListener("pagehide", flushEngagement);
    };
  }, [choice, enabled, test, qa]);
  useEffect(() => { engine.current?.route(); }, [pathname]);

  function choose(next) {
    if (next === "rejected") engine.current?.stop();
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, choice: next, at: Date.now() })); } catch { /* Storage unavailable: optional tracking stays off. */ }
    if (next === "rejected") {
      const domains = ["", location.hostname, "." + location.hostname, "ajspaintingtx.com", ".ajspaintingtx.com"];
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (/^(_ga(?:_|$)|_gid$|_gat|_gcl_|_clck$|_clsk$)/.test(name)) {
          for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
        }
      }
    }
    setChoice(next); setOpen(false); trigger.current?.focus?.();
  }
  const show = publicPath(pathname) && (open || choice === null);
  return <>
    {show && <section ref={panel} tabIndex={-1} className="analytics-consent" aria-labelledby="analytics-heading" data-clarity-mask="true">
      <h2 id="analytics-heading">Your privacy choices</h2>
      <p>With your permission, Google Analytics helps us understand visits and inquiries. Optional analytics stays off until you accept. Forms and booking work either way. No advertising tracking or session replays.</p>
      {open && <p>Current choice: {choice === "accepted" ? "analytics accepted" : "optional analytics off"}. Reject optional also withdraws earlier consent.</p>}
      <div className="consent-actions">
        <button type="button" onClick={() => choose("accepted")}>Accept analytics</button>
        <button type="button" onClick={() => choose("rejected")}>Reject optional</button>
      </div>
      <Link href="/privacy">Read our privacy notice</Link>
      {open && <button className="consent-close" type="button" onClick={() => { setOpen(false); trigger.current?.focus?.(); }}>Close without changing</button>}
    </section>}
    {test && <details className="analytics-test" data-testid="analytics-test"><summary>Local analytics test — no data sent to Google</summary><pre>{JSON.stringify(events, null, 2)}</pre></details>}
  </>;
}
