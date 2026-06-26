(() => {
  "use strict";

  document.documentElement.classList.add("js-ready");

  const revealElements = [...document.querySelectorAll("[data-reveal]")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px" });
    revealElements.forEach(element => observer.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add("is-visible"));
  }

  const header = document.querySelector(".site-header");
  const syncHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 16);
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  const faqSearch = document.getElementById("faq-search");
  if (faqSearch) {
    const items = [...document.querySelectorAll(".faq-item")];
    const groups = [...document.querySelectorAll(".faq-group")];
    const normalize = value => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("nl");

    const filterFaq = () => {
      const query = normalize(faqSearch.value.trim());
      items.forEach(item => {
        const matches = !query || normalize(item.textContent).includes(query);
        item.classList.toggle("is-filtered-out", !matches);
        if (matches && query) {
          const button = item.querySelector("[data-accordion-button]");
          button?.setAttribute("aria-expanded", "true");
          item.classList.add("open");
        }
      });
      groups.forEach(group => {
        const visible = [...group.querySelectorAll(".faq-item")]
          .some(item => !item.classList.contains("is-filtered-out"));
        group.classList.toggle("is-empty", !visible);
      });
    };

    faqSearch.addEventListener("input", filterFaq);
  }
})();
