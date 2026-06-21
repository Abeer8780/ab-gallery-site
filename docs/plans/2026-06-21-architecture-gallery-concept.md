# Architecture Gallery — Concept & Interaction Design

**Date:** 2026-06-21
**Status:** Concept (approved direction) — building a *concept clickthrough* prototype
**Content domain:** Architecture studio / portfolio
**Design posture:** Familiar core (masonry / grid feed) + novel, scroll-driven motion
**Stack:** ✅ Static HTML / CSS / JS for the clickthrough prototype; to be ported to a **Next.js** app later.

---

## 1. The idea in one line

A clean three-column architecture gallery whose entry moment is a **scroll-driven choreography**: the page opens with the studio name and a few *scattered* cards peeking from the bottom, and as the user scrolls, the cards **settle and align into a uniform three-column grid**. Selecting a card **expands it into a detail view via a View Transition**, morphing the card seamlessly into the full view.

This keeps the underlying browsing model conventional and instantly legible, while the signature motion (scatter → settle → grid, and card → detail morph) is what makes it feel alive.

---

## 2. Page layout

### Initial load (above the fold)
- **Background:** plain white.
- **Top ~70–80% of viewport:** the architect / studio name (large display type) — and nothing else competing with it. Calm, editorial.
- **Sticky top nav:** thin, persistent. 2–3 **grey** text links pinned to the **right** end. (e.g. `Work · Studio · Contact`.)
- **Bottom ~25–30% of viewport:** the first 1–2 rows of the gallery, shown as **scattered cards** of varying visual sizes, with gaps and **no overlaps**. They peek up into view, inviting the scroll.

### Card sizes (scattered state)
- A small **predefined** set of sizes — e.g. `100%`, `90%`, `80%`, `60%` (scale factors). Not random, not too many. Authored so the arrangement reads as intentional and never overlaps.

### After scroll (the resting state)
- All cards become **100% size** (a card already at 100% simply stays).
- Cards **align into a uniform three-column grid**.
- From this point down, the layout **remains a three-column grid** for all subsequent rows. Standard, predictable scrolling.

---

## 3. Interaction flow

1. **Load** → studio name (top 70–80%) + scattered first rows (bottom 25–30%), sticky nav with grey links top-right.
2. **Scroll down** → scattered cards animate: each translates/scales/rotates from its scattered offset to its grid slot, settling into the three-column grid. The title scrolls away above.
3. **Continue scrolling** → uniform three-column grid, additional rows as normal.
4. **Hover a card** → the card **scales up ~10%** (subtle lift / emphasis).
5. **Click a card** → the card **expands into a detail view above the gallery**, using a **View Transition** so the card morphs (position + size) into the expanded view. (Reference feel: the Chrome view-transitions "off the beaten path" SPA demo and the "charming-crumble" netlify demo.)
6. **Back / Close** → reverse View Transition; the detail view collapses back into its card in the three-column grid.

---

## 4. Technical approach & feasibility

> **Verdict: achievable with plain CSS Grid + CSS scroll-driven animations + the View Transitions API. No heavy libraries required.**

### 4.1 Scatter → grid (the entry choreography)
- **Mechanism:** CSS **scroll-driven animations** (`animation-timeline: scroll()`), driving `@keyframes` that animate each scattered card from a `transform: translate(...) scale(...) rotate(...)` offset (progress 0) to `transform: none` (progress 1).
- **Key principle — animate transforms over a *real* grid, never animate layout.** The final three-column layout is the genuine CSS Grid resting state; the scattered look is purely a transform offset on top of each card's real grid slot. This keeps the animation on the compositor thread (only `transform` / `opacity` animate) → smooth, no layout thrash.
- **Uniform final cells:** the varying 60/80/90/100% sizes are `scale()` illusions in the scattered state; every card resolves to `scale(1)` (100%) in the grid. This matches the "become 100%, stay 100% if already 100%" behavior.
- **Scope of the effect:** only the first 1–2 rows (~6 cards) need the scatter→settle animation; later rows are plain grid (optionally a gentle fade-in on enter).
- **Declaration order gotcha:** set `animation-timeline` *after* the `animation` shorthand, or the shorthand resets the timeline.
- **Accessibility:** gate the motion behind `@media (prefers-reduced-motion: no-preference)`.

### 4.2 Hover
- Simple `transform: scale(1.1)` with a `transition` on hover. Trivial, broadly supported.

### 4.3 Card → detail expand (View Transitions API)
- **Mechanism:** wrap the DOM update (grid → detail view) in `document.startViewTransition(() => updateDOM())`.
- **Shared element:** give the clicked card and the detail hero a shared `view-transition-name`. **Only one element may carry a given name at a time**, so we assign the name to the clicked card dynamically on click, then **clean it up** after `transition.finished` resolves (so the next click works).
- **Accessibility:** after the transition, move focus to the detail view's heading (`tabindex="-1"`) — View Transitions don't manage focus automatically. Reverse on close.
- **Reduced motion:** disable the transition animations under `prefers-reduced-motion: reduce`.

### 4.4 Browser support & fallbacks
| Feature | Support | Fallback |
|---|---|---|
| **View Transitions (same-doc)** | Baseline *newly available* (Oct 2025): Chrome/Edge 111+, Safari 18+, Firefox 144+ | Built-in: unsupported browsers just swap the DOM instantly (no animation, no breakage). |
| **Scroll-driven animations** | Chrome/Edge 115+, Safari 26+; **not Firefox** | Wrap in `@supports ((animation-timeline: view()) and (animation-range: entry))`; non-supporting browsers render the three-column grid **statically** (skip the scatter choreography). The gallery remains fully usable. |

- **Do NOT** use the `scroll-timeline-polyfill` (known to be incomplete).
- This is a **concept clickthrough**, so a Chromium-first target is acceptable — same posture as the linked reference demos.

---

## 5. Scope

**In scope (concept clickthrough):**
- Home / gallery: scattered-load → scroll-settle → three-column grid.
- Sticky nav (2–3 grey links, right-aligned).
- Hover lift (~10%).
- Card → detail expand and back, via View Transitions.
- A handful of placeholder architecture projects (enough to fill 2–3 rows), using **placeholder images from the internet** (Lorem Picsum, grayscale for a cohesive editorial look).

**Out of scope (for now):**
- CMS / backend / real content pipeline.
- Filtering, search, pagination.
- Full responsive polish beyond what's needed to demo the idea (mobile can collapse the 3-col grid to 1–2 cols and may skip the scatter).
- The richer "Concept B / C" ideas (sketch-to-built reveal, site-plan index) — parked as future enhancements.

---

## 6. Open questions / decisions to confirm

1. **Studio identity:** placeholder name/brand for the prototype? (e.g. a fictional "ATELIER —" studio.)
2. **Card content:** image-only cards, or image + project title/location overlay?
3. **Detail view content:** what fills the expanded view — a hero image + a few lines, or a small image set?
4. **Stack:** ✅ Decided — static HTML/CSS/JS single page for the clickthrough; convert to a Next.js app later.
5. **Scroll distance** for the scatter→settle: how much scroll "budget" the choreography occupies before the grid locks.

---

## 7. Implementation phases

1. **Phase 1 — Grid layout + sticky nav.** Static three-column gallery (the resting state), sticky top nav with grey links, editorial hero with the studio name (top ~70–80%), placeholder images, hover lift (~10%). *(this phase)*
2. **Phase 2 — Scatter → grid choreography.** Scroll-driven animation morphing the first 1–2 rows from a scattered state into the three-column grid, with `@supports` gating + reduced-motion + static fallback.
3. **Phase 3 — Card → detail expand.** View Transitions API morphing a clicked card into a detail view and back, with dynamic `view-transition-name` assignment, focus routing, and reduced-motion handling.

## 8. References

- View Transitions demo — off the beaten path (SPA): https://view-transitions.chrome.dev/off-the-beaten-path/spa/
- View Transitions demo — charming-crumble: https://charming-crumble-af45ba.netlify.app/
- Baseline inspiration (to surpass): northpoint.co.kr/work, proloog.tv, buro-os.com, big.dk
