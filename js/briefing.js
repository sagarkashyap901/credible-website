/* CREDIBLE — briefing.js
   Fetches "The Credible Briefing" from Supabase (public anon key, read-only —
   see js/auth.js for where that key lives) and renders the homepage
   horizontal strip. Stays hidden in the markup until the first brief loads,
   so an empty table never shows a broken-looking empty section. No redeploy
   is needed once the /news command publishes the first brief — this file
   always reads live from Supabase. */

(function () {
  "use strict";

  var SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  var configured =
    SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  var track = document.getElementById("briefingTrack");
  var section = document.querySelector(".briefing-section");
  var divider = document.querySelector(".section-divider");

  if (!configured || !track) return;

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderCard(brief) {
    // Homepage teaser: date, headline, body excerpt. Topic label and key
    // number still show on the full entry in briefing.html — see
    // js/briefing-page.js.
    var a = document.createElement("a");
    a.className = "brief-card";
    a.href = "briefing.html#brief-" + brief.id;

    a.appendChild(el("span", "brief-dateline", brief.dateline));
    a.appendChild(el("h3", "brief-headline", brief.headline));
    a.appendChild(el("p", "brief-summary", brief.summary));

    return a;
  }

  function renderStrip(briefs) {
    track.innerHTML = "";
    briefs.forEach(function (b) { track.appendChild(renderCard(b)); });
    if (section) section.hidden = false;
    if (divider) divider.hidden = false;
  }

  function wireArrows() {
    var prev = document.querySelector(".briefing-arrow-prev");
    var next = document.querySelector(".briefing-arrow-next");
    var firstCard = track.querySelector(".brief-card");
    var step = firstCard ? firstCard.getBoundingClientRect().width + 14 : 250;
    if (prev) prev.addEventListener("click", function () {
      track.scrollBy({ left: -step, behavior: "smooth" });
    });
    if (next) next.addEventListener("click", function () {
      track.scrollBy({ left: step, behavior: "smooth" });
    });
  }

  fetch(
    SUPABASE_URL + "/rest/v1/news_briefs?select=*&order=published_at.desc&limit=20",
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY } }
  )
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (briefs) {
      if (!Array.isArray(briefs) || !briefs.length) return;
      renderStrip(briefs);
      wireArrows();
    })
    .catch(function (err) {
      console.error("Credible: could not load the briefing", err);
    });
})();
