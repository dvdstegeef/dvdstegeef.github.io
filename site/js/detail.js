document.addEventListener("DOMContentLoaded", () => {
  const app = window.DVDApp;
  const id = new URLSearchParams(location.search).get("id");
  const root = document.getElementById("dvd-detail");
  const related = document.getElementById("related-grid");

  const list = value => Array.isArray(value) ? value.filter(Boolean) : [];
  const field = (label, value) => {
    const visible = Array.isArray(value) ? value.filter(Boolean).join(", ") : value;
    if (visible === undefined || visible === null || String(visible).trim() === "") return "";
    return `<div><dt>${app.escapeHtml(label)}</dt><dd>${app.escapeHtml(visible)}</dd></div>`;
  };

  const render = () => {
    const dvd = app.getCatalog().find(item => app.normalizeId(item.id) === app.normalizeId(id));
    if (!dvd) {
      root.innerHTML = `<div class="empty-state page-empty"><h1>Dvd niet gevonden</h1><p>Deze dvd bestaat niet of is uit het aanbod verwijderd.</p><a class="primary-button" href="dvds.html">Terug naar alle dvd's</a></div>`;
      return;
    }

    document.title = `${dvd.title} | dvdstegeef.`;
    const unavailable = app.isReserved(dvd.id);
    const enabled = app.isReservationEnabled();
    const state = app.getAvailabilityState();
    const buttonText = unavailable
      ? "Niet meer beschikbaar"
      : !enabled ? "Reserveren tijdelijk uit" : app.isInCart(dvd.id) ? "Geselecteerd" : "Voeg toe aan mijn selectie";

    const genres = list(dvd.genre);
    const age = dvd.age === "AL" ? "Alle leeftijden" : dvd.age ? `${dvd.age}+` : "Niet vermeld";
    const original = dvd.originalTitle && dvd.originalTitle !== dvd.title
      ? `<p class="detail-original-title">Oorspronkelijke titel: ${app.escapeHtml(dvd.originalTitle)}</p>` : "";

    root.innerHTML = `<div class="container detail-cinema">
      <div class="detail-poster-stage">
        <img class="detail-poster" src="${app.escapeHtml(dvd.image || 'assets/poster-placeholder.svg')}" alt="Hoes van ${app.escapeHtml(dvd.title)}" onerror="this.onerror=null;this.src='assets/poster-placeholder.svg';">
        ${unavailable ? '<span class="status-badge unavailable large">Al gereserveerd</span>' : ""}
      </div>
      <div class="detail-cinema__copy">
        <a class="back-link" href="dvds.html">← Terug naar de filmkast</a>
        <div class="detail-cinema__genres">${genres.map(genre => `<span>${app.escapeHtml(genre)}</span>`).join("") || "<span>Film</span>"}</div>
        <h1>${app.escapeHtml(dvd.title)}</h1>
        ${original}
        <p class="detail-lead">${app.escapeHtml(dvd.description || "Geen samenvatting beschikbaar.")}</p>
        <div class="detail-facts">
          <span>${app.escapeHtml(dvd.year || "Jaar onbekend")}</span>
          <span>${app.escapeHtml(age)}</span>
          ${dvd.duration ? `<span>${app.escapeHtml(dvd.duration)} minuten</span>` : ""}
          ${dvd.language ? `<span>${app.escapeHtml(dvd.language)}</span>` : ""}
          <span>Gratis over te nemen</span>
        </div>
        <dl class="metadata-grid">
          ${field("Uitgavejaar", dvd.year)}
          ${field("Leeftijd", age)}
          ${field("Speelduur", dvd.duration ? `${dvd.duration} minuten` : "")}
          ${field("Gesproken taal", dvd.language)}
          ${field("Regisseur", dvd.director)}
          ${field("Acteurs", list(dvd.actors))}
          ${field("Ondertiteling", dvd.subtitles)}
          ${field("Regiocode", dvd.regionCode)}
        </dl>
        <div class="detail-actions">
          <button class="primary-button" type="button" data-add-dvd="${app.escapeHtml(app.normalizeId(dvd.id))}" ${unavailable || !enabled ? "disabled" : ""}>${buttonText}</button>
          <a class="secondary-button" href="reservation.html">Mijn selectie bekijken</a>
        </div>
        <div class="info-note">
          <strong>${enabled ? "Deze dvd is gratis en kan op afspraak worden afgehaald" : "Publieke catalogus in veilige leesmodus"}</strong>
          <p>${enabled ? "Na je reservatie neemt Toby persoonlijk contact op om afhaling in Borsbeek of een mogelijke verzending te bespreken." : app.escapeHtml(state.error || "De beveiligde reserveringsservice is nog niet gekoppeld.")}</p>
        </div>
        <div class="detail-mini-journey" aria-label="Wat gebeurt na selecteren">
          <article><span>01</span><strong>Toevoegen aan je selectie</strong></article>
          <article><span>02</span><strong>Contact en afspraak</strong></article>
          <article><span>03</span><strong>Volledig jouw eigendom</strong></article>
        </div>
      </div>
    </div>`;

    related.innerHTML = "";
    app.getAvailable()
      .filter(item => app.normalizeId(item.id) !== app.normalizeId(dvd.id) && list(item.genre).some(genre => genres.includes(genre)))
      .slice(0, 4)
      .forEach(item => related.append(app.movieCard(item)));
  };

  document.addEventListener("dvd:availabilitychange", render);
  render();
});
