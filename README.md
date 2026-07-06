# Credible — News & Research Site

A complete front-end for a Gen-Z geopolitics / India / tech publication.
Pure HTML + CSS + ~1.5 KB of vanilla JS. No frameworks, no build step —
open `index.html` in any browser.

## Pages

| File            | Purpose                                              |
|-----------------|------------------------------------------------------|
| `index.html`    | Homepage — hero article, latest grid, sections, data rail |
| `india.html`    | Section page (also `world.html`, `tech.html`, `data.html`) |
| `article.html`  | Full article template — standfirst, byline, inline SVG charts, share buttons, subscribe CTA |
| `subscribe.html`| Subscribe / login form (front-end only)              |
| `about.html`    | About + privacy + contact                            |
| `css/style.css` | Entire design system                                 |
| `js/main.js`    | Hamburger menu, sticky-nav shadow, scroll reveal, reading progress bar |
| `build_sections.py` | Optional generator used to produce the four section pages — edit the `SECTIONS` dict and rerun to add articles |

## Design system

- **Palette:** white paper `#ffffff`, ink `#16181d`, gray `#6e7480`,
  electric ultramarine accent `#2430ff` (links, buttons, charts, ticker).
- **Type:** Archivo (headlines/UI) · Newsreader (article prose, 18px / 1.65) ·
  Space Mono (metadata, eyebrows, ticker, chart labels).
- **Prose column:** capped at 680px ≈ 60–65 characters per line.
- **Signature elements:** the wire ticker under the masthead and the
  accent reading-progress bar on article pages.

## Swapping in real images

Cards currently use lightweight CSS-gradient art (`<figure class="art art-1">`)
so the demo works offline. To use photos, replace the figure with:

```html
<figure class="art">
  <img src="images/story.jpg" alt="Describe the image" loading="lazy" width="800" height="500">
  <span class="tag">India</span>
</figure>
```

`loading="lazy"` gives you native lazy-loading; keep `width`/`height`
to avoid layout shift.

## Next phase (not implemented, by design)

- Hook subscribe/login forms to auth + payments (Supabase / Firebase / Razorpay).
- Newsletter delivery for the CTA forms (all forms carry `data-placeholder-form`
  and currently show a "coming soon" note on submit).
- CMS or static-site generator if article volume grows — the card and
  article markup is deliberately template-friendly.

## Accessibility & performance notes

- Sticky nav with visible keyboard focus states throughout.
- `prefers-reduced-motion` disables the ticker, reveals and transitions.
- SVG charts carry `role="img"` + descriptive `aria-label`.
- Zero external JS; fonts are the only third-party request.
