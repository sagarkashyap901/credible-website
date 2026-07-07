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
  const revealEls = document.querySelectorAll(".reveal");

  if (!reduced && "IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
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
