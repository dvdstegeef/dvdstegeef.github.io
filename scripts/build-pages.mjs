import { cp, mkdir, rm, readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = join(root, "site");
const output = join(root, "_site");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

const apiBaseUrl = String(process.env.PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
const contactEmail = String(process.env.PUBLIC_CONTACT_EMAIL || "info@dvdstegeef.be").trim();
if (apiBaseUrl && !/^https:\/\//i.test(apiBaseUrl)) {
  throw new Error("PUBLIC_API_BASE_URL moet leeg zijn of met https:// beginnen.");
}
const config = `window.DVDSTEGEEF_CONFIG = Object.freeze(${JSON.stringify({
  apiBaseUrl,
  environment: "production",
  contactEmail
}, null, 2)});\n`;
await writeFile(join(output, "js", "runtime-config.js"), config, "utf8");

const apiOrigin = apiBaseUrl ? new URL(apiBaseUrl).origin : "";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https://image.tmdb.org",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "font-src 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join("; ");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }))).flat();
}
for (const file of await walk(output)) {
  if (!file.endsWith(".html")) continue;
  const html = await readFile(file, "utf8");
  await writeFile(file, html.replaceAll("__CSP__", csp), "utf8");
}
console.log(`Pages-build gereed. API: ${apiBaseUrl || "niet gekoppeld (read-only)"}`);
