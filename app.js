/* =====================================================================
   Abeer Studio — Phase 3
   Card -> detail expand via the same-document View Transitions API.

   Strategy (per the same-document-transitions pattern):
   - The clicked card and the detail hero share ONE `view-transition-name`
     ("hero"), assigned dynamically so only one element ever carries it.
   - We toggle `body.detail-open`, which display:none's the side that isn't
     showing — so the shared name is only ever live on a single rendered
     element at snapshot time.
   - Graceful fallback when startViewTransition is unavailable (instant swap)
     and when the user prefers reduced motion.
   - Focus is routed to the detail heading on open and back to the card on
     close (View Transitions do not manage focus).
   ===================================================================== */
(function () {
  "use strict";

  const detail = document.getElementById("detail");
  const gallery = document.getElementById("work");
  if (!detail || !gallery) return;

  const heroImg = detail.querySelector(".detail__img");
  const titleEl = detail.querySelector(".detail__title");
  const idxEl = detail.querySelector(".detail__idx");
  const backBtn = detail.querySelector(".detail__back");
  const subImgs = detail.querySelectorAll(".detail__sub");

  const PROGRAMS = [
    "Pavilion", "Residential", "Cultural", "Mixed-use", "Museum",
    "Civic", "Hospitality", "Landscape", "Atrium",
  ];

  let lastFocused = null;
  let savedScroll = 0;

  const canTransition = () => typeof document.startViewTransition === "function";
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function preload(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = src;
    });
  }

  function readCard(card) {
    const img = card.querySelector(".card__media img");
    const src = img.currentSrc || img.src;
    const meta = card.querySelector(".card__meta").textContent.trim(); // "Oslo — 2024"
    const [place, year] = meta.split("—").map((s) => s.trim());
    const idx = card.querySelector(".card__idx").textContent.trim();
    const seedMatch = src.match(/seed\/([^/]+)\//);
    return {
      title: card.querySelector(".card__title").textContent.trim(),
      place: place || "",
      year: year || "",
      idx,
      alt: img.alt,
      seed: seedMatch ? seedMatch[1] : "abeer",
      heroColour: src.replace("?grayscale", ""), // detail blooms to colour
      program: PROGRAMS[(parseInt(idx, 10) - 1 + PROGRAMS.length) % PROGRAMS.length],
    };
  }

  function applyText(d) {
    idxEl.textContent = "(" + d.idx + " / 09)";
    titleEl.textContent = d.title;
    detail.querySelectorAll('[data-field="place"]').forEach((el) => (el.textContent = d.place));
    detail.querySelectorAll('[data-field="year"]').forEach((el) => (el.textContent = d.year));
    detail.querySelectorAll('[data-field="program"]').forEach((el) => (el.textContent = d.program));
    subImgs.forEach((el) => {
      const k = el.dataset.sub;
      el.src = `https://picsum.photos/seed/${d.seed}-${k}/1200/800`;
      el.alt = `${d.title} — view ${k.toUpperCase()}`;
    });
  }

  async function openDetail(card) {
    lastFocused = card.querySelector(".card__media");
    savedScroll = window.scrollY; // restored on close so the reverse morph lands on the card
    const d = readCard(card);
    applyText(d);

    // Make sure the colour hero is decoded before the snapshot is taken,
    // otherwise the "new" view-transition state captures a blank image.
    await preload(d.heroColour);
    heroImg.src = d.heroColour;
    heroImg.alt = d.alt;

    card.classList.add("selected"); // grants the card image `view-transition-name: hero`

    const mutate = () => {
      document.body.classList.add("detail-open");
      window.scrollTo(0, 0);
    };

    if (!canTransition() || reducedMotion()) {
      mutate();
      afterOpen();
      return;
    }
    document.startViewTransition(mutate).finished.finally(afterOpen);
  }

  function afterOpen() {
    detail.setAttribute("aria-hidden", "false");
    titleEl.focus(); // announce the project to assistive tech
  }

  function closeDetail() {
    const mutate = () => {
      document.body.classList.remove("detail-open");
      window.scrollTo(0, savedScroll); // return the grid to where it was before opening
    };

    if (!canTransition() || reducedMotion()) {
      mutate();
      afterClose();
      return;
    }
    document.startViewTransition(mutate).finished.finally(afterClose);
  }

  function afterClose() {
    detail.setAttribute("aria-hidden", "true");
    // Remove the shared name so the next transition can reassign it cleanly.
    gallery.querySelectorAll(".card.selected").forEach((c) => c.classList.remove("selected"));
    if (lastFocused) lastFocused.focus();
  }

  // Wire up cards
  gallery.querySelectorAll(".card").forEach((card) => {
    const trigger = card.querySelector(".card__media");
    if (!trigger) return;
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openDetail(card);
    });
  });

  backBtn.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("detail-open")) {
      closeDetail();
    }
  });
})();
