
document.addEventListener("DOMContentLoaded", () => {
  const app = window.DVDApp;
  const row = document.getElementById("home-movie-row");

  const renderFeatured = () => {
    const available = app.getAvailable();
    const count = document.querySelector("[data-available-count]");
    if (count) count.textContent = available.length;

    if (!row) return;
    row.innerHTML = "";

    const selected = [];
    const seen = new Set();
    const add = item => {
      const id = app.normalizeId(item.id);
      if (seen.has(id) || selected.length >= 7) return;
      seen.add(id);
      selected.push(item);
    };

    available.filter(item => item.featured).forEach(add);
    available
      .filter(item => item.imported)
      .sort((a, b) => new Date(b.importedAt || 0) - new Date(a.importedAt || 0))
      .forEach(add);
    available.forEach(add);

    selected.forEach(item => row.append(app.movieCard(item)));

    if (!selected.length) {
      row.innerHTML = `
        <div class="empty-state">
          <h3>Even geen dvd's beschikbaar</h3>
          <p>Kom later terug voor nieuw aanbod.</p>
        </div>`;
    }
  };

  const form = document.getElementById("home-search");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    const value = new FormData(form).get("q")?.toString().trim() || "";
    location.href = `dvds.html?q=${encodeURIComponent(value)}`;
  });

  document.querySelectorAll("[data-genre-link]").forEach(link => {
    link.href = `dvds.html?genre=${encodeURIComponent(link.dataset.genreLink)}`;
  });

  document.addEventListener("dvd:availabilitychange", renderFeatured);
  document.addEventListener("dvd:catalogchange", renderFeatured);
  renderFeatured();
});
