document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form-card");
  if (!form) return;
  form.classList.remove("demo-form");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    if (window.DVDAPI.isConfigured()) {
      try {
        await window.DVDAPI.sendContact(values);
        form.reset();
        window.DVDApp.toast("Bedankt. Je bericht is veilig verstuurd.");
      } catch (error) { window.DVDApp.toast(error.message); }
      return;
    }
    const subject = encodeURIComponent(values.subject || "Vraag via dvdstegeef.");
    const body = encodeURIComponent(`${values.firstName || ""} ${values.lastName || ""}\nReservering: ${values.reservationCode || "niet vermeld"}\n\n${values.message || ""}`);
    location.href = `mailto:${window.DVDSTEGEEF_CONFIG.contactEmail}?subject=${subject}&body=${body}`;
  });
});
