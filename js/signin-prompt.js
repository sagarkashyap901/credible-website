/* CREDIBLE — signin-prompt.js
   A blocking "Sign in" popup shown ONLY to anonymous visitors, ONLY on
   free articles. Deliberately separate from js/membership.js, which
   targets a different audience (signed-in-but-not-paying readers) with a
   different ask (subscribe, not sign in) — the two never overlap, since a
   reader is either signed in or not at any given moment.

   Trigger: whichever comes first — 2 minutes on the page, OR 55% scroll
   depth (the midpoint of the 50–60% range this was speced at). Both start
   racing the instant this script runs; the first one to fire wins and
   cancels the other.

   No subscribe button here on purpose — the ask is ONLY for an account.
   The existing subscribe popup (js/membership.js) already takes over
   correctly once someone is signed in but not yet a paying member — no
   changes needed there, this file doesn't touch it.

   Dismiss (the X, backdrop click, or Escape) is remembered for 7 days,
   using its own separate localStorage key so it can never interfere with
   js/membership.js's independent 7-day dismiss memory for the subscribe
   popup. */

(function () {
  "use strict";

  var DELAY_MS      = 120000; // 2 minutes
  var SCROLL_PCT    = 55;     // midpoint of the 50–60% range
  var SNOOZE_DAYS   = 7;
  var STORAGE_KEY   = "credible_signin_prompt_dismissed_at";

  // Only ever relevant on FREE article pages.
  if (document.body.getAttribute("data-premium") !== "false") return;
  if (!document.querySelector("article .prose")) return; // not an article page

  var SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  var configured =
    SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  if (!configured || !window.supabase) return;

  var sb = window.CREDIBLE_SB || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.CREDIBLE_SB = sb;

  function recentlyDismissed() {
    try {
      var at = window.localStorage.getItem(STORAGE_KEY);
      if (!at) return false;
      var days = (Date.now() - parseInt(at, 10)) / (1000 * 60 * 60 * 24);
      return days < SNOOZE_DAYS;
    } catch (e) {
      return false; // storage blocked — fail open, just show it
    }
  }

  function rememberDismissal() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) { /* ignore */ }
  }

  function scrolledEnough() {
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight);
    if (max <= 0) return true; // short page — nothing to scroll
    return (h.scrollTop / max) * 100 >= SCROLL_PCT;
  }

  function buildPrompt() {
    var wrap = document.createElement("div");
    wrap.className = "signin-prompt";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Sign in to Credible");

    wrap.innerHTML =
      '<div class="signin-prompt-backdrop"></div>' +
      '<div class="signin-prompt-box">' +
        '<button class="signin-prompt-x" aria-label="Close">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<span class="signin-prompt-eyebrow">Credible</span>' +
        '<h2>Sign in to keep reading.</h2>' +
        '<p>Create a free account — it takes seconds, no payment needed — to keep reading, pick up where you left off, and get member-only briefings.</p>' +
        '<a class="btn btn-accent signin-prompt-cta" href="/subscribe.html">Sign in</a>' +
        '<p class="signin-prompt-fine">Free forever. No card required.</p>' +
      '</div>';

    return wrap;
  }

  function showPrompt() {
    if (document.querySelector(".signin-prompt")) return; // already up

    var el = buildPrompt();
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("open");
    });

    function close() {
      el.classList.remove("open");
      rememberDismissal();
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
      document.removeEventListener("keydown", onKey);
    }

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    el.querySelector(".signin-prompt-x").addEventListener("click", close);
    el.querySelector(".signin-prompt-backdrop").addEventListener("click", close);
    document.addEventListener("keydown", onKey);

    // Clicking through to sign in also counts as handled — no need to
    // interrupt them again this week once they're on their way.
    el.querySelector(".signin-prompt-cta").addEventListener("click", rememberDismissal);
  }

  function schedule() {
    if (recentlyDismissed()) return;

    var fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
      showPrompt();
    }

    var timer = setTimeout(fire, DELAY_MS);
    function onScroll() {
      if (scrolledEnough()) fire();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  (async function init() {
    try {
      var result = await sb.auth.getSession();
      var session = result && result.data && result.data.session;
      if (session) return; // signed in already — this prompt is for anonymous visitors only
    } catch (e) {
      /* Supabase check failed — treat as anonymous and still show it;
         worst case a signed-in reader sees an extra "Sign in" prompt,
         which is a harmless annoyance, not a broken experience. */
    }
    schedule();
  })();
})();
