# Publiceren via GitHub Pages

1. Maak op GitHub een lege repository `dvdstegeef` aan.
2. Push deze map naar de branch `main`.
3. Open **Settings → Pages** en kies bij **Build and deployment**: **GitHub Actions**.
4. Stel optioneel onder **Settings → Secrets and variables → Actions → Variables** in:
   - `PUBLIC_API_BASE_URL` — alleen de publieke HTTPS-URL van de API.
   - `PUBLIC_CONTACT_EMAIL` — het publieke contactadres.
5. Push naar `main`; de workflow voert eerst een security-audit uit en publiceert daarna `_site`.

De verwachte URL is `https://toby13dp.github.io/dvdstegeef/`.

Zonder `PUBLIC_API_BASE_URL` werkt de site bewust in leesmodus: catalogus en informatiepagina's zijn zichtbaar, maar persoonsgegevens worden nergens opgeslagen.
