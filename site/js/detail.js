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
      : !enabled ? "Reserveren tijdelijk uit" : app.isInCart(dvd.id) ? "Geselecteerd" : "Reserveer deze dvd";

    root.innerHTML = `<div class="container detail-layout">
      <div class="detail-poster-wrap">
        <img class="detail-poster" src="${app.escapeHtml(dvd.image || 'assets/poster-placeholder.svg')}" alt="Hoes van ${app.escapeHtml(dvd.title)}" onerror="this.onerror=null;this.src='assets/poster-placeholder.svg';">
        ${unavailable ? '<span class="status-badge unavailable large">Al gereserveerd</span>' : ""}
      </div>
      <div class="detail-copy">
        <a class="back-link" href="dvds.html">← Terug naar alle dvd's</a>
        <p class="eyebrow">${app.escapeHtml(list(dvd.genre).join(" · "))}</p>
        <h1>${app.escapeHtml(dvd.title)}</h1>
        <p class="detail-lead">${app.escapeHtml(dvd.description || "Geen samenvatting beschikbaar.")}</p>
        <dl class="metadata-grid">
          ${field("Jaar", dvd.year)}
          ${field("Leeftijd", dvd.age === "AL" ? "Alle leeftijden" : `${dvd.age}+`)}
          ${field("Speelduur", dvd.duration ? `${dvd.duration} minuten` : "")}
          ${field("Taal", dvd.language)}
          ${field("Regisseur", dvd.director)}
          ${field("Acteurs", list(dvd.actors))}
        </dl>
        <div class="detail-actions">
          <button class="primary-button" type="button" data-add-dvd="${app.escapeHtml(app.normalizeId(dvd.id))}" ${unavailable || !enabled ? "disabled" : ""}>${buttonText}</button>
          <a class="secondary-button" href="reservation.html">Mijn selectie bekijken</a>
        </div>
        <div class="info-note">
          <strong>${enabled ? "Gratis reserveren en afhalen in Borsbeek" : "Publieke catalogus in veilige leesmodus"}</strong>
          <p>${enabled ? "Toby neemt na je aanvraag contact op om een geschikt moment af te spreken." : app.escapeHtml(state.error || "De beveiligde reserveringsservice is nog niet gekoppeld.")}</p>
        </div>
      </div>
    </div>`;

    related.innerHTML = "";
    app.getAvailable()
      .filter(item => app.normalizeId(item.id) !== app.normalizeId(dvd.id) && list(item.genre).some(genre => list(dvd.genre).includes(genre)))
      .slice(0, 4)
      .forEach(item => related.append(app.movieCard(item)));
  };

  document.addEventListener("dvd:availabilitychange", render);
  render();
});
