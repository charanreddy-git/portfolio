import { readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.PORT || 8080;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon"
};

function send(res, status, filePath) {
  const ext = extname(filePath);
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(status, { "Content-Type": type });
  res.end(readFileSync(filePath));
}

function isFile(p) {
  try { return statSync(p).isFile(); } catch (_) { return false; }
}

createServer(function (req, res) {
  let url = req.url.split("?")[0];
  if (url.endsWith("/") && url !== "/") url = url.slice(0, -1);

  const candidates = [
    join(root, url),
    join(root, url + ".html"),
    join(root, url, "index.html")
  ];

  for (const c of candidates) {
    if (isFile(c)) {
      send(res, 200, c);
      return;
    }
  }

  const knownRoutes = ["/", "/projects", "/blog", "/resume"];
  const base = "/" + (url.split("/")[1] || "");
  if (knownRoutes.indexOf(base) !== -1) {
    const fallback = join(root, "404.html");
    if (isFile(fallback)) {
      send(res, 404, fallback);
      return;
    }
  }

  const fallback = join(root, "404.html");
  if (isFile(fallback)) {
    send(res, 404, fallback);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
}).listen(PORT, function () {
  console.log("Listening on http://localhost:" + PORT);
});
