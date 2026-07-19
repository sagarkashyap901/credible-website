/* CREDIBLE — main.js
   Lightweight interactivity: no frameworks, ~1.5 KB. */

(function () {
  "use strict";

  /* Hamburger menu ------------------------------------------------ */
  const burger = document.querySelector(".hamburger");
  const links = document.querySelector(".nav-links");

  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
    });
    // Close menu after choosing a section
    links.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Sticky nav shadow when scrolled ------------------------------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Scroll-reveal animations (respects reduced motion) ------------ */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Auto-enroll elements that should reveal but lack the class in HTML,
     so existing pages get the choreography without content edits. */
  if (!reduced) {
    document
      .querySelectorAll(".row-list .row, .account-card, .account-upsell, .most-read-list li")
      .forEach((el) => el.classList.add("reveal"));
  }

  const revealEls = document.querySelectorAll(".reveal");

  if (!reduced && "IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        /* Elements entering in the same frame stagger like a dealt hand;
           a lone element scrolled into view reveals with zero delay. */
        let i = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay = Math.min(i, 8) * 70 + "ms";
            entry.target.classList.add("in");
            io.unobserve(entry.target);
            i++;
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* Reading progress bar (article pages only) --------------------- */
  const bar = document.querySelector(".progress");
  if (bar) {
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* Placeholder form handling (no backend yet) --------------------- */
  document.querySelectorAll("[data-placeholder-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = form.querySelector(".form-note");
      if (note) note.textContent = "Thanks — backend integration coming soon.";
    });
  });

  /* Share buttons (article pages) ---------------------------------- */
  const shareBox = document.querySelector(".share");
  if (shareBox) {
    const pageUrl = encodeURIComponent(window.location.href.split("#")[0]);
    const pageTitle = encodeURIComponent(document.title.replace(/ — Credible$/, ""));
    const targets = {
      "Share on X": "https://twitter.com/intent/tweet?url=" + pageUrl + "&text=" + pageTitle,
      "Share on WhatsApp": "https://wa.me/?text=" + pageTitle + "%20" + pageUrl,
      "Share on LinkedIn": "https://www.linkedin.com/sharing/share-offsite/?url=" + pageUrl
    };
    shareBox.querySelectorAll("a[aria-label]").forEach((a) => {
      const label = a.getAttribute("aria-label");
      if (targets[label]) {
        a.href = targets[label];
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } else if (label === "Copy link") {
        a.href = "#";
        a.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            await navigator.clipboard.writeText(window.location.href.split("#")[0]);
            a.style.borderColor = "var(--accent)";
            a.style.color = "var(--accent)";
            setTimeout(() => { a.style.borderColor = ""; a.style.color = ""; }, 1500);
          } catch (_) {}
        });
      }
    });
  }
})();

/* CREDIBLE — motion choreography (19 Jul 2026)
   Word-by-word headline reveal + prose scroll reveals on article pages.
   Runs only when <html> carries the .motion class (set by a one-line
   inline script in <head>, skipped for reduced-motion visitors). */
(function () {
  "use strict";

  if (!document.documentElement.classList.contains("motion")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* 1. Split the article headline into masked words that rise in sequence */
  const h1 = document.querySelector(".article-header h1");
  if (h1 && !h1.querySelector(".w")) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.textContent = "";
    words.forEach((word, i) => {
      const mask = document.createElement("span");
      mask.className = "w";
      const inner = document.createElement("span");
      inner.className = "wi";
      inner.textContent = word;
      inner.style.animationDelay = (0.16 + i * 0.05).toFixed(2) + "s";
      mask.appendChild(inner);
      h1.appendChild(mask);
      if (i < words.length - 1) h1.appendChild(document.createTextNode(" "));
    });
    h1.classList.add("split");
  }

  /* 2. Article body: paragraphs, headings, figures rise gently on scroll.
        Some articles split prose into multiple blocks around inline photos —
        instrument them all. The very first child of the first block is
        skipped: it joins the page-load sequence (and gets the drop cap). */
  const proseBlocks = document.querySelectorAll("article .prose");
  if (proseBlocks.length && "IntersectionObserver" in window) {
    proseBlocks[0].classList.add("has-cap");
    const kids = [];
    proseBlocks.forEach((block, b) => {
      Array.from(block.children).forEach((el, i) => {
        if (b === 0 && i === 0) return;
        kids.push(el);
      });
    });
    kids.forEach((el) => el.classList.add("pr"));

    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay = Math.min(i, 4) * 60 + "ms";
            entry.target.classList.add("in");
            io.unobserve(entry.target);
            i++;
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
    kids.forEach((el) => io.observe(el));
  }
})();
