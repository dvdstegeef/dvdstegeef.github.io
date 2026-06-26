(() => {
  "use strict";

  const KEYS = {
    cart: "dvdstegeef_cart",
    preferences: "dvdstegeef_preferences"
  };
  const STATUS_LABELS = {
    active: "Nieuw",
    contacted: "Contact opgenomen",
    scheduled: "Afspraak gepland",
    "shipping-pending": "Verzending in afwachting",
    shipped: "Verzonden",
    "picked-up": "Afgehaald",
    cancelled: "Geannuleerd",
    "no-show": "Niet opgehaald"
  };

  let reservedIds = new Set();
  let availabilityLoaded = false;
  let availabilityError = "";

  const read = (key, fallback = []) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const normalizeId = value => String(value ?? "");
  const unique = values => [...new Set(values.map(normalizeId))];
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
  const formatDate = iso => new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "long", timeStyle: "short"
  }).format(new Date(iso));

  const getCatalog = () => [...(window.DVD_DATA || [])];
  const getCart = () => unique(read(KEYS.cart, []));
  const isInCart = id => getCart().includes(normalizeId(id));
  const isReserved = id => reservedIds.has(normalizeId(id));
  const getAvailable = () => getCatalog().filter(item => !isReserved(item.id));
  const isReservationEnabled = () => window.DVDAPI?.isConfigured() && availabilityLoaded && !availabilityError;
  const getAvailabilityState = () => ({ loaded: availabilityLoaded, error: availabilityError });
  const getStatusLabel = status => STATUS_LABELS[status] || status || "Onbekend";

  const toast = message => {
    const element = document.getElementById("site-toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(window.__dvdToast);
    window.__dvdToast = setTimeout(() => element.classList.remove("show"), 3000);
  };

  const updateBadge = () => {
    const count = getCart().filter(id => !isReserved(id)).length;
    document.querySelectorAll("[data-reservation-count]").forEach(element => {
      element.textContent = String(count);
      element.hidden = count === 0;
    });
    updateSelectionDock();
  };

  const addToCart = id => {
    if (!isReservationEnabled()) {
      toast("Reserveren is pas mogelijk zodra de beveiligde service gekoppeld is.");
      return false;
    }
    const normalized = normalizeId(id);
    if (isReserved(normalized)) {
      toast("Deze dvd is niet meer beschikbaar.");
      return false;
    }
    write(KEYS.cart, unique([...getCart(), normalized]));
    updateBadge();
    document.dispatchEvent(new CustomEvent("dvd:cartchange"));
    toast("Dvd toegevoegd aan je selectie.");
    return true;
  };

  const removeFromCart = id => {
    const normalized = normalizeId(id);
    write(KEYS.cart, getCart().filter(item => item !== normalized));
    updateBadge();
    document.dispatchEvent(new CustomEvent("dvd:cartchange"));
  };

  const clearCart = () => {
    write(KEYS.cart, []);
    updateBadge();
    document.dispatchEvent(new CustomEvent("dvd:cartchange"));
  };

  const refreshAvailability = async () => {
    availabilityError = "";
    if (!window.DVDAPI?.isConfigured()) {
      availabilityLoaded = false;
      availabilityError = "De beveiligde reserveringsservice is nog niet gekoppeld.";
      document.dispatchEvent(new CustomEvent("dvd:availabilitychange"));
      return;
    }

    try {
      const ids = getCatalog().map(item => normalizeId(item.id));
      const result = await window.DVDAPI.availability(ids);
      reservedIds = new Set((result.reservedIds || []).map(normalizeId));
      availabilityLoaded = true;
    } catch (error) {
      availabilityLoaded = false;
      availabilityError = error.message || "Beschikbaarheid kon niet worden geladen.";
    }
    updateBadge();
    document.dispatchEvent(new CustomEvent("dvd:availabilitychange"));
  };

  const imageAttributes = item => {
    const source = escapeHtml(item.image || "assets/poster-placeholder.svg");
    const title = escapeHtml(item.title || "dvd");
    return `src="${source}" alt="Hoes van ${title}" loading="lazy" decoding="async" ` +
      `onerror="this.onerror=null;this.src='assets/poster-placeholder.svg';"`;
  };

  const movieCard = item => {
    const card = document.createElement("article");
    card.className = `movie-card catalog-card${isInCart(item.id) ? " is-selected" : ""}`;
    const reserved = isReserved(item.id);
    const enabled = isReservationEnabled();
    const buttonText = reserved
      ? "Niet beschikbaar"
      : !enabled
        ? "Reserveren tijdelijk uit"
        : isInCart(item.id) ? "Geselecteerd" : "Selecteer";

    card.innerHTML = `
      <a class="poster-link" href="dvd.html?id=${encodeURIComponent(item.id)}">
        <span class="movie-card-free">GRATIS</span>
        <img ${imageAttributes(item)}>
        ${reserved ? '<span class="status-badge unavailable">Niet beschikbaar</span>' : ""}
      </a>
      <div class="movie-card-body">
        <h3><a href="dvd.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a></h3>
        <p>${escapeHtml(item.year || "—")} · ${escapeHtml(item.genre?.[0] || "Film")}</p>
        <button class="reserve-card-button${isInCart(item.id) ? " selected" : ""}"
                type="button" data-add-dvd="${escapeHtml(normalizeId(item.id))}"
                ${reserved || !enabled ? "disabled" : ""}>${buttonText}</button>
      </div>`;
    return card;
  };

  const updateSelectionDock = () => {
    let dock = document.getElementById("selection-dock");
    const page = location.pathname.split("/").pop() || "index.html";
    if (page === "reservation.html") {
      dock?.classList.remove("is-visible");
      return;
    }
    const items = getCart()
      .filter(id => !isReserved(id))
      .map(id => getCatalog().find(item => normalizeId(item.id) === id))
      .filter(Boolean);

    if (!dock) {
      dock = document.createElement("aside");
      dock.id = "selection-dock";
      dock.className = "selection-dock";
      dock.setAttribute("aria-live", "polite");
      dock.innerHTML = `
        <span class="selection-dock-count">0</span>
        <span class="selection-dock-copy"><strong>Mijn selectie</strong><span></span></span>
        <a class="primary-button" href="reservation.html">Reserveren</a>`;
      document.body.append(dock);
    }
    dock.querySelector(".selection-dock-count").textContent = items.length;
    dock.querySelector(".selection-dock-copy span").textContent =
      items.slice(0, 3).map(item => item.title).join(", ") +
      (items.length > 3 ? ` en ${items.length - 3} meer` : "");
    dock.classList.toggle("is-visible", items.length > 0 && isReservationEnabled());
  };

  const setupHeader = () => {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("open", !open);
      });
    }
    updateBadge();
  };

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-add-dvd]");
    if (!button) return;
    const id = button.dataset.addDvd;
    if (isInCart(id)) {
      removeFromCart(id);
      document.querySelectorAll(`[data-add-dvd="${CSS.escape(id)}"]`).forEach(item => {
        item.textContent = "Selecteer";
        item.classList.remove("selected");
        item.closest(".movie-card")?.classList.remove("is-selected");
      });
      toast("Dvd uit je selectie verwijderd.");
    } else if (addToCart(id)) {
      document.querySelectorAll(`[data-add-dvd="${CSS.escape(id)}"]`).forEach(item => {
        item.textContent = "Geselecteerd";
        item.classList.add("selected");
        item.closest(".movie-card")?.classList.add("is-selected");
      });
    }
  });

  const registerServiceWorker = () => {
    if (!("serviceWorker" in navigator) || !["http:", "https:"].includes(location.protocol)) return;
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  };

  window.DVDApp = {
    KEYS, STATUS_LABELS, read, write, escapeHtml, formatDate, normalizeId,
    getCatalog, getAvailable, getCart, isReserved, isInCart,
    isReservationEnabled, getAvailabilityState, getStatusLabel,
    addToCart, removeFromCart, clearCart, refreshAvailability,
    movieCard, updateBadge, toast
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupHeader();
    refreshAvailability();
    registerServiceWorker();
  });
})();
