# Beveiligde backendcontract

GitHub Pages is uitsluitend de publieke frontend. Persoonsgegevens, accounts, reserveringen, blokkeringen en beheerdata horen in een afzonderlijke HTTPS-API en database.

## Publieke endpoints

- `GET /public/availability?ids=id1,id2` → `{ "reservedIds": [] }`
- `POST /public/reservations` → `{ "code": "DVD-12345678" }`
- `POST /public/reservations/lookup` → beperkte gegevens plus een kortlevend `managementToken`
- `POST /public/reservations/{code}/cancel` met `managementToken`
- `POST /public/contact`

## Accountendpoints

- `POST /auth/register`
- `POST /auth/login` → kortlevend `accessToken`
- `GET /me`
- `GET /me/reservations`
- `PATCH /me/reservations/{code}`
- `POST /me/reservations/{code}/cancel`

## Verplichte beveiliging

- HTTPS en strikte CORS naar alleen de GitHub Pages- en eventuele eigen domeinnaam.
- Rate limiting, invoervalidatie en server-side transacties tegen dubbele reserveringen.
- Wachtwoorden uitsluitend als sterke hashes, nooit plaintext. Een magic-linkflow verdient de voorkeur.
- Beheerdersauthenticatie met MFA; geen beheerwachtwoord in frontendcode.
- Geheimen uitsluitend in de backend-host of secret manager.
- Database niet publiek; minimale gegevens, bewaartermijnen en auditlog.
- `managementToken` gehasht opslaan, kort laten verlopen en eenmalig gebruiken waar mogelijk.
