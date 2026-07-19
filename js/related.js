/* CREDIBLE — related.js
   Fills the "Related stories" block from articles.js:
   same section first, excludes the current page, max 3. */
(function () {
  "use strict";
  var box = document.querySelector("[data-related]");
  var data = window.CREDIBLE_ARTICLES || [];
  if (!box || !data.length) return;

  var here = location.pathname.split("/").pop() || "index.html";
  var section = box.getAttribute("data-related");

  var pool = data.filter(function (a) { return a.url !== here; });
  var same = pool.filter(function (a) { return a.section === section; });
  var rest = pool.filter(function (a) { return a.section !== section; });
  var picks = same.concat(rest).slice(0, 3);

  box.innerHTML = picks.map(function (a) {
    return '<a href="/articles/' + a.url + '">' +
      '<span class="r-section">' + a.section + " · " + a.date + '</span>' +
      '<div class="r-title">' + a.title + '</div></a>';
  }).join("");
})();
