import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

const distDir = "dist";
const serverDir = join(distDir, "server");
const hostingOutDir = join(distDir, ".openai");
const files = {};

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (fullPath.startsWith(serverDir) || fullPath.startsWith(hostingOutDir)) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const publicPath = `/${relative(distDir, fullPath).split(sep).join("/")}`;
    const buffer = readFileSync(fullPath);
    files[publicPath] = {
      body: buffer.toString("base64"),
      type: contentTypes[extname(fullPath)] ?? "application/octet-stream"
    };
  }
}

walk(distDir);

mkdirSync(serverDir, { recursive: true });
mkdirSync(hostingOutDir, { recursive: true });
copyFileSync(join(".openai", "hosting.json"), join(hostingOutDir, "hosting.json"));

const source = `const files = ${JSON.stringify(files)};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = files[path] || files["/index.html"];

    return new Response(decodeBase64(file.body), {
      headers: {
        "content-type": file.type,
        "cache-control": path === "/index.html" ? "no-cache" : "public, max-age=31536000, immutable"
      }
    });
  }
};
`;

writeFileSync(join(serverDir, "index.js"), source);
