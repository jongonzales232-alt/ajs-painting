// Local-only form boundary for browser QA. Never forwards POSTs to the real app.
import http from "node:http";
import { qaMonitor } from "./analytics-qa-monitor.mjs";
let submissions = 0;
http.createServer(async (req, res) => {
  if (req.url === "/__qa__/status") {
    res.setHeader("Content-Type", "text/html");
    res.end(`<h1>Local QA only</h1><p>Intercepted submissions: ${submissions}</p><p>No messages sent or records saved.</p>`); return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (!/^\/api\/(quote|contact|schedule)$/.test(req.url)) { res.writeHead(405); res.end(); return; }
    let body = ""; for await (const chunk of req) body += chunk;
    submissions++;
    const fail = body.includes("Simulate failure");
    res.writeHead(fail ? 503 : 200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(fail ? { ok: false, error: "Simulated local failure. Please retry." } : { ok: true, id: `local-test-${submissions}`, email: { sent: true, owner: { sent: true }, customer: { sent: true } } })); return;
  }
  const requestHeaders = { ...req.headers, host: "localhost:3101", "accept-encoding": "identity" };
  delete requestHeaders["if-none-match"]; delete requestHeaders["if-modified-since"];
  const upstream = http.request({ hostname: "127.0.0.1", port: 3100, path: req.url, method: req.method, headers: requestHeaders }, (reply) => {
    if (process.env.ANALYTICS_QA_MONITOR === "1" && reply.headers["content-type"]?.includes("text/html")) {
      let html = ""; reply.setEncoding("utf8"); reply.on("data", (chunk) => { html += chunk; });
      reply.on("end", () => {
        const headers = { ...reply.headers, "cache-control": "no-store" }; delete headers["content-length"]; delete headers["content-encoding"];
        res.writeHead(reply.statusCode, headers);
        res.end(html.replace(/src="(\/_next\/static\/[^"?]+\.js)"/g, `src="$1?qa=${Date.now()}"`).replace("</head>", `<script>(${qaMonitor.toString()})()</script></head>`));
      });
    } else { res.writeHead(reply.statusCode, reply.headers); reply.pipe(res); }
  });
  upstream.on("error", () => { res.writeHead(502); res.end("Local preview is starting. Reload shortly."); });
  req.pipe(upstream);
}).listen(3101, "127.0.0.1", () => console.log("Local browser QA: http://127.0.0.1:3101 — all writes are simulated"));
