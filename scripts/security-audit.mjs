import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join, relative } from "node:path";

const root = resolve(process.argv[2] || "_site");
const forbiddenFiles = [
  /(^|\/)admin\.html$/i, /(^|\/)login\.html$/i, /(^|\/)\.env/i,
  /backup.*\.json$/i, /dvd-import.*\.json$/i, /private-data/i
];
const forbiddenText = [
  { pattern: /C:\\\\Users\\\\/i, label: "lokaal Windows-gebruikerspad" },
  { pattern: /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i, label: "private key" },
  { pattern: /demo123/i, label: "demo-beheerwachtwoord" },
  { pattern: /SUPABASE_SERVICE_ROLE/i, label: "service-role geheim" },
  { pattern: /[\"']Ocr[\"']\s*:/, label: "ruwe OCR-data" },
  { pattern: /[\"']Titelkandidaten[\"']\s*:/, label: "titelkandidaten" },
  { pattern: /[\"']Bestanden[\"']\s*:/, label: "lokale bronbestanden" }
];
const textExtensions = new Set([".html", ".js", ".css", ".json", ".xml", ".txt", ".md", ".svg"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }))).flat();
}

const errors = [];
for (const file of await walk(root)) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (forbiddenFiles.some(pattern => pattern.test(rel))) errors.push(`${rel}: verboden bestand in Pages-artifact`);
  const extension = file.slice(file.lastIndexOf("."));
  if (!textExtensions.has(extension)) continue;
  if ((await stat(file)).size > 5_000_000) continue;
  const content = await readFile(file, "utf8");
  for (const check of forbiddenText) if (check.pattern.test(content)) errors.push(`${rel}: bevat ${check.label}`);
}
if (errors.length) {
  console.error("Security-audit mislukt:\n" + errors.map(error => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log("Security-audit geslaagd: geen backenddata, geheimen of beheerpagina's in het Pages-artifact.");
