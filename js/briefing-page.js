/* CREDIBLE — briefing-page.js
   Renders every published brief on briefing.html: grouped by day (Asia/Kolkata
   calendar date), newest day first, newest brief first within each day. */

(function () {
  "use strict";

  var SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  var configured =
    SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  var content = document.getElementById("briefingContent");
  var updatedEl = document.getElementById("briefingUpdated");
  var emptyEl = document.getElementById("briefingEmpty");

  if (!configured || !content) return;

  var dayFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric"
  });
  var timeFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true
  });
  // en-CA formats as YYYY-MM-DD — a stable, locale-independent group/sort key.
  var keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderEntry(b) {
    var article = el("article", "briefing-full-entry");
    article.id = "brief-" + b.id;

    var top = el("div", "brief-top");
    top.appendChild(el("span", "brief-topic", b.topic_label));
    top.appendChild(el("span", "brief-dateline", b.dateline));
    article.appendChild(top);

    article.appendChild(el("div", "brief-number", b.key_number));
    article.appendChild(el("h3", "brief-headline-full", b.headline));
    article.appendChild(el("p", "brief-summary-full", b.summary));

    var sources = Array.isArray(b.source_links) ? b.source_links : [];
    if (sources.length) {
      var srcLine = el("p", "brief-sources");
      srcLine.appendChild(document.createTextNode("Sources: "));
      sources.forEach(function (s, i) {
        var a = document.createElement("a");
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = s.name || s.url;
        srcLine.appendChild(a);
        if (i < sources.length - 1) srcLine.appendChild(document.createTextNode(", "));
      });
      article.appendChild(srcLine);
    }

    if (b.related_article_url) {
      var link = document.createElement("a");
      link.className = "brief-analysis-link";
      link.href = b.related_article_url;
      link.textContent = "Read the full analysis →";
      article.appendChild(link);
    }

    return article;
  }

  fetch(
    SUPABASE_URL + "/rest/v1/news_briefs?select=*&order=published_at.desc&limit=500",
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY } }
  )
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (briefs) {
      if (!Array.isArray(briefs) || !briefs.length) {
        if (updatedEl) updatedEl.textContent = "No briefs published yet.";
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      if (updatedEl) {
        updatedEl.textContent = "Updated " + timeFormat.format(new Date(briefs[0].published_at)) + " IST";
      }

      var groups = [];
      var byKey = {};
      briefs.forEach(function (b) {
        var key = keyFormat.format(new Date(b.published_at));
        if (!byKey[key]) {
          byKey[key] = [];
          groups.push({ key: key, items: byKey[key] });
        }
        byKey[key].push(b);
      });

      groups.forEach(function (group) {
        var section = el("section", "section briefing-day");
        var container = el("div", "container");
        var head = el("div", "section-head");
        head.appendChild(el("h2", null, dayFormat.format(new Date(group.items[0].published_at))));
        container.appendChild(head);

        var list = el("div", "briefing-full-list");
        group.items.forEach(function (b) { list.appendChild(renderEntry(b)); });
        container.appendChild(list);

        section.appendChild(container);
        content.appendChild(section);
      });
    })
    .catch(function (err) {
      console.error("Credible: could not load the briefing page", err);
      if (updatedEl) updatedEl.textContent = "Could not load the briefing.";
    });
})();
