"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const RUNWAY_APP = process.env.RUNWAY_APP || "(RUNWAY_APP not set)";

const template = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const STATIC_DIR = path.join(__dirname, "static");
const MIME = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

// Serve a file from static/, refusing any path that escapes the dir.
function serveStatic(urlPath, res) {
  const rel = urlPath.replace("/static/", "");
  const full = path.join(STATIC_DIR, rel);

  if (!full.startsWith(STATIC_DIR + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const type = MIME[path.extname(full)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

// Inject server-side values as JSON so quotes and special chars stay safe.
function render() {
  const config = JSON.stringify({ app: RUNWAY_APP });
  return template.replace("__APP_CONFIG__", config);
}

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(render());
    return;
  }

  if (req.url.startsWith("/static/")) {
    serveStatic(req.url, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// Shut down cleanly on Ctrl+C / docker stop. As PID 1 in a container, Node
// gets no default signal handler, so without this the process ignores SIGINT
// and Docker has to SIGKILL it after a timeout.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
