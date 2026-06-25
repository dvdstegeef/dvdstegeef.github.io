# dvdstegeef. — GitHub Pages-frontend

Publieke, statische frontend voor het gratis dvd-weggeefplatform van Toby De Prins. De repository is voorbereid voor automatische publicatie op GitHub Pages zonder backendgegevens, persoonsgegevens of beheerwachtwoorden in de publieke site.

## Belangrijkste veiligheidskeuze

GitHub Pages kan **geen geheime backend** hosten. Alles wat in de Pages-build terechtkomt, is publiek downloadbaar. Daarom:

- bevat `site/` alleen de publieke frontend en gesaneerde catalogusvelden;
- worden reserveringen/accounts alleen via een afzonderlijke HTTPS-API verwerkt;
- wordt zonder API niets met persoonsgegevens in de browser opgeslagen;
- worden `admin.html`, demo-inloggegevens, back-ups en ruwe OCR-imports niet gepubliceerd;
- blokkeert de security-audit publicatie bij gevoelige patronen.

## Lokaal bekijken

```bash
python -m http.server 8000 --directory site
```

Open daarna `http://localhost:8000`. Zonder API draait de site in veilige leesmodus.

## Publieke catalogus genereren uit privé-import

```bash
node scripts/sanitize-catalog.mjs private-data/dvd-import.json site/js/data.js
```

Alleen publiek noodzakelijke filmvelden worden geëxporteerd. OCR, lokale coverpaden, scores en opmerkingen blijven buiten Git.

## GitHub Pages

Zie [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). De workflow publiceert uitsluitend `site/` naar het Pages-artifact en draait vooraf `scripts/security-audit.mjs`.

## Backend

Zie [docs/BACKEND-CONTRACT.md](docs/BACKEND-CONTRACT.md). De API kan bijvoorbeeld op Cloudflare Workers, Fly.io, Render of een eigen server draaien. Geheimen blijven daar in omgevingsvariabelen of een secret manager.

## Licentie

Geen opensourcelicentie meegeleverd; alle rechten voorbehouden door Toby De Prins.
