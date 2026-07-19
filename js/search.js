/* CREDIBLE — search.js
   Client-side instant search over window.CREDIBLE_ARTICLES.
   Opens with the nav icon or the "/" key; Esc closes. */

(function () {
  "use strict";

  const overlay = document.querySelector(".search-overlay");
  const input = overlay && overlay.querySelector("input");
  const results = overlay && overlay.querySelector(".search-results");
  const openBtns = document.querySelectorAll("[data-search-open]");
  const closeBtn = overlay && overlay.querySelector(".esc");
  const data = window.CREDIBLE_ARTICLES || [];
  let selected = -1;

  if (!overlay || !input || !results) return;

  function open() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    input.value = "";
    render(data.slice(0, 6));
    setTimeout(() => input.focus(), 30);
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    selected = -1;
  }

  function render(items) {
    selected = -1;
    if (!items.length) {
      results.innerHTML = '<div class="search-empty">No stories found. Try another keyword.</div>';
      return;
    }
    results.innerHTML = items
      .map(
        (a) =>
          '<a href="/articles/' + a.url + '">' +
          '<span class="r-section">' + a.section + " · " + a.date + "</span>" +
          '<div class="r-title">' + a.title + "</div>" +
          '<div class="r-excerpt">' + a.excerpt + "</div>" +
          "</a>"
      )
      .join("");
  }

  function query(q) {
    q = q.trim().toLowerCase();
    if (!q) return data.slice(0, 6);
    const words = q.split(/\s+/);
    return data
      .map((a) => {
        const hay = (a.title + " " + a.excerpt + " " + a.section).toLowerCase();
        let score = 0;
        words.forEach((w) => {
          if (a.title.toLowerCase().includes(w)) score += 3;
          else if (hay.includes(w)) score += 1;
        });
        return { a, score };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .map((x) => x.a)
      .slice(0, 8);
  }

  openBtns.forEach((b) => b.addEventListener("click", open));
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  input.addEventListener("input", () => render(query(input.value)));

  document.addEventListener("keydown", (e) => {
    const isOpen = overlay.classList.contains("open");
    if (e.key === "/" && !isOpen && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      open();
    }
    if (!isOpen) return;
    const links = results.querySelectorAll("a");
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown") { e.preventDefault(); selected = Math.min(selected + 1, links.length - 1); }
    if (e.key === "ArrowUp")   { e.preventDefault(); selected = Math.max(selected - 1, 0); }
    if (e.key === "Enter" && selected >= 0 && links[selected]) links[selected].click();
    links.forEach((l, i) => l.classList.toggle("selected", i === selected));
  });
})();
