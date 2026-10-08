// Injected ONLY by the loopback QA proxy. Not imported by the deployed app.
export function qaMonitor() {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) return;
  const framed = window.parent !== window;
  const key = "ajs.qa.network";
  const relevant = (url) => /google-analytics\.com|googletagmanager\.com|analytics\.google\.com/.test(String(url));
  function record(entry) {
    entry.at = Date.now();
    if (framed) { window.parent.ajsQaRecord?.(entry); return; }
    let entries = []; try { entries = JSON.parse(sessionStorage.getItem(key) || "[]"); } catch { /* test-only storage */ }
    entries.push(entry); sessionStorage.setItem(key, JSON.stringify(entries.slice(-150))); render();
  }
  function render() {
    const output = document.getElementById("qa-network");
    if (output) output.textContent = JSON.stringify({
      cookies: document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean),
      foreground: document.visibilityState,
      focused: document.hasFocus(),
      frameFocused: document.querySelector('iframe[src="/analytics/frame"]')?.contentDocument?.hasFocus() || false,
      collectorFrames: document.querySelectorAll('iframe[src="/analytics/frame"]').length,
      records: JSON.parse(sessionStorage.getItem(key) || "[]")
    }, null, 2);
  }
  const originalFetch = window.fetch;
  window.fetch = function (input, options) {
    const url = typeof input === "string" ? input : input.url;
    if (relevant(url)) record({ kind: "fetch", url, body: typeof options?.body === "string" ? options.body : String(options?.body || "") });
    const response = originalFetch.apply(this, arguments);
    if (relevant(url)) response.then((r) => record({ kind: "response", url, status: r.status, type: r.type })).catch(() => record({ kind: "error", url }));
    return response;
  };
  const originalBeacon = navigator.sendBeacon;
  navigator.sendBeacon = function (url, data) {
    if (relevant(url)) {
      if (data instanceof Blob) data.text().then((body) => record({ kind: "beacon", url, body }));
      else record({ kind: "beacon", url, body: String(data || "") });
    }
    return originalBeacon.apply(this, arguments);
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) { this.qaUrl = String(url); return originalOpen.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (body) {
    if (relevant(this.qaUrl)) record({ kind: "xhr", url: this.qaUrl, body: String(body || "") });
    return originalSend.apply(this, arguments);
  };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (relevant(entry.name)) record({ kind: "resource", url: entry.name, initiator: entry.initiatorType });
  }).observe({ type: "resource", buffered: true });
  if (!framed) {
    // Synchronous recording preserves requests made during iframe disposal/unload.
    window.ajsQaRecord = record;
    // Exercise link analytics without launching a dialer or email application.
    document.addEventListener("click", (event) => {
      const href = event.target.closest?.("a[href]")?.getAttribute("href") || "";
      if (/^(tel:|mailto:)/.test(href)) event.preventDefault();
    });
    document.addEventListener("DOMContentLoaded", () => {
      const panel = document.createElement("details");
      panel.style.cssText = "margin:20px;padding:16px;border:2px solid #555;background:white;color:black;overflow:auto";
      const label = document.createElement("summary"); label.textContent = "QA network evidence — test property only";
      const clear = document.createElement("button"); clear.textContent = "Clear QA evidence";
      clear.onclick = () => { sessionStorage.removeItem(key); render(); };
      const output = document.createElement("pre"); output.id = "qa-network";
      panel.append(label, clear, output); document.body.appendChild(panel); render();
      setInterval(render, 500);
    });
  }
}
