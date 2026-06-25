document.addEventListener("DOMContentLoaded", () => {
  const app = window.DVDApp;
  const api = window.DVDAPI;
  const form = document.getElementById("reservation-form");
  const selection = document.getElementById("reservation-selection");
  const summary = document.getElementById("reservation-summary");
  const count = document.getElementById("reservation-page-count");
  const success = document.getElementById("reservation-success");
  const layout = document.getElementById("reservation-layout");
  const serviceNotice = document.getElementById("account-recommendation");
  const shippingFields = document.getElementById("shipping-fields");
  const shippingTotal = document.getElementById("shipping-total");

  serviceNotice.innerHTML = api.isConfigured()
    ? `<div><p class="section-kicker">Beveiligde verwerking</p><h2>Je gegevens worden via de externe API verwerkt.</h2><p>GitHub Pages bevat geen reserverings- of accountgegevens.</p></div>`
    : `<div><p class="section-kicker">Reserveren nog niet actief</p><h2>De beveiligde backend moet nog worden gekoppeld.</h2><p>De publieke GitHub Pages-site bewaart bewust geen persoonsgegevens. Neem voorlopig rechtstreeks contact op.</p></div><a class="secondary-button" href="mailto:${encodeURIComponent(window.DVDSTEGEEF_CONFIG.contactEmail)}">E-mail Toby</a>`;

  const setShipping = () => {
    const shipping = form.elements.deliveryMethod.value === "shipping";
    shippingFields.hidden = !shipping;
    shippingTotal.hidden = !shipping;
    ["street", "postalCode", "city", "country"].forEach(name => form.elements[name].required = shipping);
    form.elements.shippingPaymentAgreement.required = shipping;
  };
  [...form.elements.deliveryMethod].forEach(input => input.addEventListener("change", setShipping));
  setShipping();

  const render = () => {
    const items = app.getCart()
      .filter(id => !app.isReserved(id))
      .map(id => app.getCatalog().find(item => app.normalizeId(item.id) === app.normalizeId(id)))
      .filter(Boolean);
    count.textContent = String(items.length);
    selection.innerHTML = "";
    summary.innerHTML = "";

    if (!items.length) {
      selection.innerHTML = `<div class="empty-state"><h2>Je selectie is leeg</h2><p>Kies eerst één of meer dvd's.</p><a class="primary-button" href="dvds.html">Bekijk het aanbod</a></div>`;
      form.hidden = true;
      return;
    }

    form.hidden = false;
    form.querySelector('button[type="submit"]').disabled = !api.isConfigured();
    items.forEach(item => {
      const article = document.createElement("article");
      article.className = "reservation-item";
      article.innerHTML = `<img src="${app.escapeHtml(item.image || 'assets/poster-placeholder.svg')}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/poster-placeholder.svg';"><div><h2>${app.escapeHtml(item.title)}</h2><p>${app.escapeHtml(item.year)} · ${app.escapeHtml((item.genre || []).join(', '))}</p></div><button class="remove-button" type="button" data-remove-dvd="${app.escapeHtml(app.normalizeId(item.id))}" aria-label="${app.escapeHtml(item.title)} verwijderen">×</button>`;
      selection.append(article);
      const li = document.createElement("li");
      li.textContent = item.title;
      summary.append(li);
    });
  };

  document.addEventListener("dvd:cartchange", render);
  document.addEventListener("dvd:availabilitychange", render);
  render();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!api.isConfigured()) return app.toast("De beveiligde reserveringsservice is nog niet gekoppeld.");
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    if (values.contactPreference === "E-mail" && !String(values.email || "").trim()) return app.toast("Vul je e-mailadres in.");
    if (["SMS", "WhatsApp"].includes(values.contactPreference) && !String(values.phone || "").trim()) return app.toast("Vul je telefoonnummer in.");

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Bezig met reserveren…";
    try {
      const payload = {
        dvdIds: app.getCart(),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || "",
          phone: values.phone || "",
          contactPreference: values.contactPreference,
          note: values.note || ""
        },
        deliveryMethod: values.deliveryMethod,
        shipping: values.deliveryMethod === "shipping" ? {
          street: values.street, postalCode: values.postalCode,
          city: values.city, country: values.country
        } : null
      };
      const result = await api.createReservation(payload);
      app.clearCart();
      layout.hidden = true;
      serviceNotice.hidden = true;
      success.hidden = false;
      success.innerHTML = `<span class="success-icon">✓</span><p class="eyebrow">Reservering ontvangen</p><h1>Bedankt, ${app.escapeHtml(values.firstName)}.</h1><p>Je reserveringsnummer is <strong>${app.escapeHtml(result.code)}</strong>.</p><p>Toby neemt contact op zodra de reservering gecontroleerd is.</p><div class="button-row"><a class="primary-button" href="dvds.html">Terug naar de dvd's</a><a class="secondary-button" href="account.html">Reservering beheren</a></div>`;
      await app.refreshAvailability();
    } catch (error) {
      app.toast(error.message || "Reserveren is mislukt.");
      submit.disabled = false;
      submit.textContent = "Definitief reserveren";
    }
  });
});
