import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const input = resolve(process.argv[2] || "private-data/dvd-import.json");
const output = resolve(process.argv[3] || "site/js/data.js");
const source = JSON.parse(await readFile(input, "utf8"));
if (!Array.isArray(source)) throw new Error("De import moet een JSON-array zijn.");
const safe = source.map((record, index) => {
  const film = record.Film || {};
  const edition = record.DvdUitgave || {};
  const title = String(film.Titel || "").trim();
  const year = Number(film.Jaar || String(film.Releasedatum || "").slice(0, 4));
  if (!title || !Number.isInteger(year)) throw new Error(`Record ${index + 1}: Titel/Jaar ontbreekt.`);
  return {
    id: film.TmdbId ? `tmdb-${film.TmdbId}` : edition.Barcode ? `barcode-${String(edition.Barcode).replace(/\D/g, "")}` : `dvd-${record.Id ?? index + 1}`,
    title,
    originalTitle: String(film.OrigineleTitel || ""),
    year,
    genre: Array.isArray(film.Genres) && film.Genres.length ? film.Genres.map(String) : ["Onbekend"],
    age: String(film.NederlandseFilmclassificatie || "AL").match(/\d+/)?.[0] || "AL",
    language: String(film.OorspronkelijkeTaal || "").toUpperCase() || "Onbekend",
    director: Array.isArray(film.Regisseurs) ? film.Regisseurs.join(", ") : "Onbekend",
    actors: Array.isArray(film.Hoofdcast) ? film.Hoofdcast.map(String) : [],
    duration: Number(film.SpeelduurMinuten || edition.SpeelduurMinuten || 0),
    image: /^https:\/\/image\.tmdb\.org\//i.test(String(film.PosterUrl || "")) ? film.PosterUrl : "assets/poster-placeholder.svg",
    description: String(film.Samenvatting || "Geen samenvatting beschikbaar."),
    tmdbId: film.TmdbId || null,
    imdbId: String(film.ImdbId || ""),
    barcode: String(edition.Barcode || "").replace(/\D/g, "")
  };
});
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `window.DVD_DATA = ${JSON.stringify(safe, null, 2)};\n`, "utf8");
console.log(`${safe.length} publieke catalogusrecords geschreven naar ${output}. Ruwe OCR, lokale paden, scores en opmerkingen zijn niet meegenomen.`);
