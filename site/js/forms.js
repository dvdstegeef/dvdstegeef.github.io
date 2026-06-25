
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-accordion-button]").forEach(button => {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      button.closest(".faq-item").classList.toggle("open", !open);
    });
  });
});
