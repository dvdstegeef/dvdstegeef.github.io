# dvdstegeef. — creatieve site-uitbreiding

Deze versie breidt de volledige publieke website zowel inhoudelijk als visueel uit. De bestaande catalogus-, selectie-, account- en API-logica blijft behouden.

## Belangrijkste vernieuwingen

- Nieuwe filmische homepagina met posterstapel, zoekfunctie, thematische genremozaïek, persoonlijk manifest, procesverhaal en uitgebreidere call-to-actions.
- Volledig nieuwe pagina **Over dvdstegeef.** met een redactionele verhaallijn, dvd-visuals, persoonlijke context, cataloguspreview en waardenmozaïek.
- Uitgebreide pagina **Zo werkt het** met zes inhoudelijke hoofdstukken, visuele route, vergelijking tussen afhalen en verzending en heldere afspraken bij gemiste afhaalmomenten.
- Creatievere catalogus met een herkenbare “Film Finder”, snelle ontdeklinks, duidelijkere filters en een sterkere redactionele opbouw.
- Vernieuwde dvd-detailpagina die dynamisch een filmische detailweergave, metadata, gratis-label en overdrachtsroute toont.
- Uitgebreidere reservatieflow met visuele voortgang, uitleg over wat na de reservatie gebeurt en duidelijk onderscheid tussen afhalen en verzending.
- Vernieuwde accountpagina met voordelen, gastopzoeking en duidelijke privacycontext.
- Veel grotere FAQ, ingedeeld in zes categorieën en voorzien van live zoeken.
- Uitgebreide contact-, voorwaarden- en privacypagina’s in dezelfde visuele stijl.
- Nieuwe creatieve offlinepagina en uitgebreider footerconcept.
- Responsive stijlen voor desktop, tablet en mobiel.

## Nieuwe bestanden

- `css/creative-site.css` — aanvullende creatieve stijllaag boven op de bestaande functionele stylesheet.
- `js/experience.js` — subtiele scrollreveal, headerstatus en live FAQ-filtering.

## Aangepaste functionele bestanden

- `js/app.js` — gratis-label op dynamisch gegenereerde filmkaarten.
- `js/detail.js` — volledig vernieuwde dynamische dvd-detailweergave.
- `sw.js` — nieuwe creatieve assets toegevoegd en cacheversie verhoogd.

## Publiceren

Upload de volledige inhoud van deze map. Houd `css/site.css` én `css/creative-site.css` samen; de tweede stylesheet is bewust als laatste geladen en verfijnt de bestaande stijlen.

De publieke frontend blijft in veilige leesmodus zolang geen beveiligde API is gekoppeld via `js/runtime-config.js`.
