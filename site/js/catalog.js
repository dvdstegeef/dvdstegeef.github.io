
document.addEventListener("DOMContentLoaded", () => {
  const app = window.DVDApp;
  const form = document.getElementById("catalog-filters");
  const grid = document.getElementById("catalog-grid");
  const resultCount = document.getElementById("result-count");
  const rangeText = document.getElementById("catalog-range");
  const empty = document.getElementById("catalog-empty");
  const clear = document.getElementById("clear-filters");
  const emptyClear = document.getElementById("empty-reset-filters");
  const chips = document.getElementById("active-filter-chips");
  const pagination = document.getElementById("catalog-pagination");
  const pageSizeSelect = document.getElementById("catalog-page-size");
  const mobileToggle = document.getElementById("mobile-filter-toggle");
  const filterPanel = document.getElementById("catalog-filter-panel");

  if (!form || !grid) return;

  const fields = {
    query: form.elements.query,
    genre: form.elements.genre,
    year: form.elements.year,
    age: form.elements.age,
    language: form.elements.language,
    actor: form.elements.actor,
    director: form.elements.director,
    sort: form.elements.sort
  };

  const labels = {
    query: "Zoeken",
    genre: "Genre",
    year: "Jaar",
    age: "Leeftijd",
    language: "Taal",
    actor: "Acteur",
    director: "Regisseur"
  };

  let currentPage = 1;
  let pageSize = 24;

  const itemValues = (item, key) =>
    Array.isArray(item[key]) ? item[key] : [item[key]];

  const uniqueValues = key =>
    [...new Set(
      app.getCatalog()
        .flatMap(item => itemValues(item, key))
        .filter(value => value !== undefined && value !== null && String(value).trim())
        .map(value => String(value))
    )].sort((a, b) => a.localeCompare(b, "nl"));

  const fillSelect = (select, options) => {
    const first = select.options[0];
    select.innerHTML = "";
    select.append(first);
    options.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  };

  const populateFilters = () => {
    const current = Object.fromEntries(new FormData(form));
    fillSelect(fields.genre, uniqueValues("genre"));
    fillSelect(fields.year, uniqueValues("year").sort((a, b) => Number(b) - Number(a)));
    fillSelect(
      fields.age,
      uniqueValues("age").sort((a, b) => {
        if (a === "AL") return -1;
        if (b === "AL") return 1;
        return Number(a) - Number(b);
      })
    );
    fillSelect(fields.language, uniqueValues("language"));
    fillSelect(fields.actor, uniqueValues("actors"));
    fillSelect(fields.director, uniqueValues("director"));

    Object.entries(current).forEach(([name, value]) => {
      if (form.elements[name] && [...form.elements[name].options || []].some(option => option.value === value)) {
        form.elements[name].value = value;
      }
    });
  };

  populateFilters();

  const params = new URLSearchParams(location.search);
  fields.query.value = params.get("q") || "";
  fields.genre.value = params.get("genre") || "";
  fields.year.value = params.get("year") || "";
  fields.age.value = params.get("age") || "";
  fields.language.value = params.get("language") || "";
  fields.actor.value = params.get("actor") || "";
  fields.director.value = params.get("director") || "";
  fields.sort.value = params.get("sort") || "title-asc";
  currentPage = Math.max(1, Number(params.get("page")) || 1);
  pageSize = [24, 48, 96].includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : 24;
  pageSizeSelect.value = String(pageSize);

  const readFilters = () => Object.fromEntries(new FormData(form));

  const updateUrl = filters => {
    const next = new URLSearchParams();
    const mapping = {
      query: "q",
      genre: "genre",
      year: "year",
      age: "age",
      language: "language",
      actor: "actor",
      director: "director",
      sort: "sort"
    };

    Object.entries(mapping).forEach(([field, parameter]) => {
      const value = String(filters[field] || "").trim();
      if (value && !(field === "sort" && value === "title-asc")) {
        next.set(parameter, value);
      }
    });

    if (currentPage > 1) next.set("page", String(currentPage));
    if (pageSize !== 24) next.set("size", String(pageSize));

    const query = next.toString();
    history.replaceState({}, "", query ? `dvds.html?${query}` : "dvds.html");
  };

  const filterItems = filters => {
    const needle = String(filters.query || "").trim().toLocaleLowerCase("nl");

    const items = app.getAvailable().filter(item => {
      const genres = item.genre || [];
      const actors = item.actors || [];
      const director = item.director || "";
      const haystack = [
        item.title,
        item.originalTitle,
        item.year,
        item.language,
        director,
        item.barcode,
        item.catalogNumber,
        item.tmdbId,
        ...genres,
        ...actors
      ].join(" ").toLocaleLowerCase("nl");

      return (!needle || haystack.includes(needle))
        && (!filters.genre || genres.includes(filters.genre))
        && (!filters.year || String(item.year) === filters.year)
        && (!filters.age || String(item.age) === filters.age)
        && (!filters.language || item.language === filters.language)
        && (!filters.actor || actors.includes(filters.actor))
        && (!filters.director || director === filters.director);
    });

    const sorters = {
      "title-asc": (a, b) => String(a.title).localeCompare(String(b.title), "nl"),
      "title-desc": (a, b) => String(b.title).localeCompare(String(a.title), "nl"),
      "year-desc": (a, b) => Number(b.year || 0) - Number(a.year || 0),
      "year-asc": (a, b) => Number(a.year || 0) - Number(b.year || 0)
    };

    items.sort(sorters[filters.sort] || sorters["title-asc"]);
    return items;
  };

  const renderChips = filters => {
    chips.innerHTML = "";
    Object.entries(labels).forEach(([field, label]) => {
      const value = String(filters[field] || "").trim();
      if (!value) return;

      const chip = document.createElement("span");
      chip.className = "filter-chip";
      chip.innerHTML = `
        <span>${app.escapeHtml(label)}: ${app.escapeHtml(value)}</span>
        <button type="button" data-clear-filter="${field}" aria-label="${app.escapeHtml(label)}filter wissen">×</button>`;
      chips.append(chip);
    });
  };

  const pageButtons = (page, totalPages) => {
    const pages = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
    return [...pages]
      .filter(value => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b);
  };

  const renderPagination = totalPages => {
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "←";
    previous.disabled = currentPage === 1;
    previous.dataset.page = String(currentPage - 1);
    previous.setAttribute("aria-label", "Vorige pagina");
    pagination.append(previous);

    let last = 0;
    pageButtons(currentPage, totalPages).forEach(page => {
      if (last && page - last > 1) {
        const dots = document.createElement("span");
        dots.textContent = "…";
        dots.setAttribute("aria-hidden", "true");
        pagination.append(dots);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(page);
      button.dataset.page = String(page);
      if (page === currentPage) button.setAttribute("aria-current", "page");
      pagination.append(button);
      last = page;
    });

    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "→";
    next.disabled = currentPage === totalPages;
    next.dataset.page = String(currentPage + 1);
    next.setAttribute("aria-label", "Volgende pagina");
    pagination.append(next);
  };

  const render = ({ resetPage = false } = {}) => {
    if (resetPage) currentPage = 1;

    const filters = readFilters();
    const result = filterItems(filters);
    const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * pageSize;
    const pageItems = result.slice(start, start + pageSize);

    grid.innerHTML = "";
    pageItems.forEach(item => grid.append(app.movieCard(item)));

    resultCount.textContent = `${result.length} ${result.length === 1 ? "dvd" : "dvd's"}`;
    rangeText.textContent = result.length
      ? `Toont ${start + 1}–${Math.min(start + pageSize, result.length)} van ${result.length}`
      : "";
    empty.hidden = result.length !== 0;

    renderChips(filters);
    renderPagination(totalPages);
    updateUrl(filters);
  };

  form.addEventListener("input", () => render({ resetPage: true }));
  form.addEventListener("change", () => render({ resetPage: true }));
  form.addEventListener("submit", event => event.preventDefault());

  const resetFilters = () => {
    form.reset();
    fields.sort.value = "title-asc";
    currentPage = 1;
    pageSize = 24;
    pageSizeSelect.value = "24";
    render();
  };

  clear.addEventListener("click", resetFilters);
  emptyClear?.addEventListener("click", resetFilters);

  chips.addEventListener("click", event => {
    const button = event.target.closest("[data-clear-filter]");
    if (!button) return;
    fields[button.dataset.clearFilter].value = "";
    render({ resetPage: true });
  });

  pagination.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render();
    document.getElementById("filters").scrollIntoView({ behavior: "smooth" });
  });

  pageSizeSelect.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value);
    render({ resetPage: true });
  });

  mobileToggle?.addEventListener("click", () => {
    const open = mobileToggle.getAttribute("aria-expanded") === "true";
    mobileToggle.setAttribute("aria-expanded", String(!open));
    filterPanel.classList.toggle("is-open", !open);
  });

  document.addEventListener("dvd:availabilitychange", () => render());
  document.addEventListener("dvd:catalogchange", () => {
    populateFilters();
    render();
  });

  render();
});
