document.addEventListener("DOMContentLoaded", () => {
  const app = window.DVDApp;
  const api = window.DVDAPI;
  const auth = document.getElementById("account-auth");
  const dashboard = document.getElementById("account-dashboard");
  const loginForm = document.getElementById("account-login-form");
  const registerForm = document.getElementById("account-register-form");
  const guestForm = document.getElementById("guest-reservation-lookup");
  const guestResult = document.getElementById("guest-lookup-result");
  const reservationsRoot = document.getElementById("account-reservations");
  const accountName = document.getElementById("account-name");

  if (!api.isConfigured()) {
    auth.insertAdjacentHTML("afterbegin", `<div class="service-unavailable"><strong>Accountbeheer is nog niet actief.</strong><p>De GitHub Pages-site bevat geen wachtwoorden of persoonsgegevens. Koppel een beveiligde API om accounts en reserveringsbeheer te activeren.</p></div>`);
    auth.querySelectorAll("input, button, select, textarea").forEach(element => element.disabled = true);
    return;
  }

  const statusClass = status => String(status || "active").replace(/[^a-z-]/g, "");
  const renderReservations = reservations => {
    reservationsRoot.innerHTML = "";
    if (!reservations.length) {
      reservationsRoot.innerHTML = `<div class="empty-state"><h2>Nog geen reserveringen</h2><p>Nieuwe reserveringen verschijnen hier.</p><a class="primary-button" href="dvds.html">Dvd's bekijken</a></div>`;
      return;
    }
    reservations.forEach(reservation => {
      const card = document.createElement("article");
      card.className = "account-reservation-card";
      card.innerHTML = `<div class="account-reservation-header"><div><span class="reservation-status ${statusClass(reservation.status)}">${app.escapeHtml(app.getStatusLabel(reservation.status))}</span><h3>${app.escapeHtml(reservation.code)}</h3><p>${app.formatDate(reservation.createdAt)}</p></div><strong>${reservation.dvds?.length || 0} dvd's</strong></div><ul class="account-title-list">${(reservation.dvds || []).map(dvd => `<li>${app.escapeHtml(dvd.title)}</li>`).join("")}</ul>${reservation.mutable ? `<button class="text-button danger" type="button" data-account-cancel="${app.escapeHtml(reservation.code)}">Reservering annuleren</button>` : ""}`;
      reservationsRoot.append(card);
    });
  };

  const loadAccount = async () => {
    if (!api.getToken()) {
      auth.hidden = false;
      dashboard.hidden = true;
      return;
    }
    try {
      const [profile, reservations] = await Promise.all([api.me(), api.myReservations()]);
      auth.hidden = true;
      dashboard.hidden = false;
      accountName.textContent = `${profile.firstName}, dit zijn je reserveringen`;
      renderReservations(reservations.items || []);
    } catch {
      api.logout();
      auth.hidden = false;
      dashboard.hidden = true;
    }
  };

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    try {
      await api.login(Object.fromEntries(new FormData(loginForm)));
      await loadAccount();
    } catch (error) { app.toast(error.message); }
  });

  registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!registerForm.reportValidity()) return;
    try {
      await api.register(Object.fromEntries(new FormData(registerForm)));
      await loadAccount();
    } catch (error) { app.toast(error.message); }
  });

  document.getElementById("account-logout").addEventListener("click", () => {
    api.logout();
    location.reload();
  });

  reservationsRoot.addEventListener("click", async event => {
    const button = event.target.closest("[data-account-cancel]");
    if (!button || !confirm("Wil je deze reservering annuleren?")) return;
    try {
      await api.cancelMyReservation(button.dataset.accountCancel);
      await loadAccount();
      await app.refreshAvailability();
    } catch (error) { app.toast(error.message); }
  });

  guestForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!guestForm.reportValidity()) return;
    try {
      const result = await api.lookupReservation(Object.fromEntries(new FormData(guestForm)));
      guestResult.hidden = false;
      guestResult.dataset.managementToken = result.managementToken || "";
      guestResult.innerHTML = `<span class="reservation-status ${statusClass(result.status)}">${app.escapeHtml(app.getStatusLabel(result.status))}</span><h3>${app.escapeHtml(result.code)}</h3><p>${(result.dvds || []).map(dvd => app.escapeHtml(dvd.title)).join(", ")}</p>${result.mutable && result.managementToken ? `<button class="text-button danger" type="button" data-guest-cancel="${app.escapeHtml(result.code)}">Reservering annuleren</button>` : ""}`;
    } catch (error) {
      guestResult.hidden = false;
      guestResult.innerHTML = `<h3>Niet gevonden</h3><p>${app.escapeHtml(error.message)}</p>`;
    }
  });

  guestResult.addEventListener("click", async event => {
    const button = event.target.closest("[data-guest-cancel]");
    if (!button || !confirm("Wil je deze reservering annuleren?")) return;
    try {
      await api.cancelGuestReservation(button.dataset.guestCancel, guestResult.dataset.managementToken);
      guestResult.innerHTML = `<h3>Reservering geannuleerd</h3><p>De dvd's zijn opnieuw beschikbaar.</p>`;
      await app.refreshAvailability();
    } catch (error) { app.toast(error.message); }
  });

  loadAccount();
});
