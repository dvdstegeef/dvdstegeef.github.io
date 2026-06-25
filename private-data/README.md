# Privédata — niet committen

Plaats hier lokaal het volledige OCR/importbestand als `dvd-import.json`. Deze map wordt door `.gitignore` uitgesloten.

Genereer daarna uitsluitend de publieke catalogusvelden:

```bash
node scripts/sanitize-catalog.mjs private-data/dvd-import.json site/js/data.js
```

De sanitizer verwijdert onder andere lokale Windows-paden, OCR-tekst, titelkandidaten, kwaliteitsscores en opmerkingen.
