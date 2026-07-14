/* CREDIBLE — membership.js
   Runs on every page. Two jobs:

   1. IF THE READER IS ALREADY A PAYING MEMBER
      → hide every "Subscribe — ₹119/month" upsell box on the page.
        A paying member should never be sold something they already own.
        (The paywall gate itself is left alone — paywall.js owns that.)

   2. IF THE READER IS NOT A MEMBER
      → after a delay, show a single, dismissible subscribe prompt.

   TIMING NOTE — why 2 minutes:
   News-industry testing consistently finds prompts fired immediately on
   load convert worst (the reader hasn't got any value yet, so the ask feels
   unearned) while prompts fired *after demonstrated engagement* convert far
   better. Two minutes ≈ the point where an average reader is deep into an
   article and has decided the writing is worth their time. We ALSO require
   the reader to have scrolled a little, so someone who opens a tab and walks
   away doesn't come back to a popup they never earned.

   Dismissal is remembered for 7 days so we never nag.
*/

(function () {
  "use strict";

  /* ---- Tunables ---- */
  var DELAY_MS         = 120000; // 2 minutes of reading
  var MIN_SCROLL_PCT   = 15;     // ...and they've actually engaged
  var SNOOZE_DAYS      = 7;      // don't re-ask for a week after dismissal
  var STORAGE_KEY      = "credible_sub_prompt_dismissed_at";

  /* Never interrupt on pages that ARE the conversion flow */
  var path = (window.location.pathname || "").toLowerCase();
  var isFlowPage =
    path.indexOf("subscribe") !== -1 || path.indexOf("account") !== -1;

  var SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  var configured =
    SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  if (!configured || !window.supabase) return;

  var sb =
    window.CREDIBLE_SB ||
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.CREDIBLE_SB = sb;

  /* ---------------------------------------------------------------- */
  /* 1. Hide every upsell box once we know they're a paying member     */
  /* ---------------------------------------------------------------- */
  function hideUpsellsForMember() {
    document.body.classList.add("is-member");

    // End-of-article "Credible Membership" box, and any other CTA that
    // isn't the paywall gate itself.
    document.querySelectorAll(".cta:not(.paywall-gate)").forEach(function (el) {
      el.style.display = "none";
    });

    // The account page's "Unlock every story" upsell (belt and braces —
    // account.js already handles this, but this guarantees it).
    var accUpsell = document.getElementById("account-upsell");
    if (accUpsell) accUpsell.style.display = "none";
  }

  /* ---------------------------------------------------------------- */
  /* 2. The timed prompt for non-members                               */
  /* ---------------------------------------------------------------- */
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
    return (h.scrollTop / max) * 100 >= MIN_SCROLL_PCT;
  }

  function buildPrompt(canCheckoutInline) {
    var wrap = document.createElement("div");
    wrap.className = "sub-prompt";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Subscribe to Credible");

    // Inline Razorpay checkout only works on pages that actually loaded
    // paywall.js + the Razorpay script (article pages). Everywhere else we
    // send them to subscribe.html rather than render a button that does nothing.
    var primary = canCheckoutInline
      ? '<button class="btn btn-accent sub-prompt-cta" data-checkout type="button">Subscribe — ₹119/month</button>'
      : '<a class="btn btn-accent sub-prompt-cta" href="subscribe.html">Subscribe — ₹119/month</a>';

    wrap.innerHTML =
      '<div class="sub-prompt-backdrop" data-sub-close></div>' +
      '<div class="sub-prompt-box">' +
        '<button class="sub-prompt-x" data-sub-close aria-label="Close">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<span class="sub-prompt-eyebrow">Credible Membership</span>' +
        '<h2>Enjoying the story?</h2>' +
        '<p>Credible is independent, reader-funded journalism — no ads, no aggregation. Members get every deep dive and member-only briefing across India, World and AI &amp; Tech.</p>' +
        '<div class="sub-prompt-price"><span class="amt">₹119</span><span class="per">/ month</span></div>' +
        '<div class="sub-prompt-actions">' +
          primary +
          '<button class="btn btn-ghost" data-sub-close type="button">Maybe later</button>' +
        '</div>' +
        '<p class="sub-prompt-fine">Cancel anytime. ' +
          (canCheckoutInline ? '' : 'Already a member? <a href="subscribe.html">Sign in</a>') +
        '</p>' +
      '</div>';

    return wrap;
  }

  function showPrompt(isSignedIn) {
    if (document.querySelector(".sub-prompt")) return; // already up

    var canCheckoutInline = isSignedIn && !!window.Razorpay;
    var el = buildPrompt(canCheckoutInline);
    document.body.appendChild(el);
    // next frame → triggers the CSS transition
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

    el.querySelectorAll("[data-sub-close]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    document.addEventListener("keydown", onKey);

    // If they hit Subscribe, don't nag again either.
    var cta = el.querySelector(".sub-prompt-cta");
    if (cta) cta.addEventListener("click", rememberDismissal);
  }

  function schedulePrompt(isSignedIn) {
    if (isFlowPage) return;
    if (recentlyDismissed()) return;

    setTimeout(function () {
      if (scrolledEnough()) {
        showPrompt(isSignedIn);
      } else {
        // Not engaged yet — wait until they scroll, then show.
        var onScroll = function () {
          if (scrolledEnough()) {
            window.removeEventListener("scroll", onScroll);
            showPrompt(isSignedIn);
          }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    }, DELAY_MS);
  }

  /* ---------------------------------------------------------------- */
  /* Decide which of the two paths this reader is on                   */
  /* ---------------------------------------------------------------- */
  (async function init() {
    var session = null;
    try {
      var r = await sb.auth.getSession();
      session = r && r.data && r.data.session;
    } catch (e) { /* treat as guest */ }

    if (!session) {
      document.body.classList.add("is-guest");
      schedulePrompt(false);
      return;
    }

    // Signed in — are they actually paying?
    var active = false;
    try {
      var res = await fetch(
        SUPABASE_URL + "/rest/v1/subscriptions?user_id=eq." + session.user.id +
          "&select=status,current_period_end",
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: "Bearer " + session.access_token
          }
        }
      );
      var rows = await res.json().catch(function () { return []; });
      var sub = Array.isArray(rows) ? rows[0] : null;
      active =
        !!sub &&
        sub.status === "active" &&
        new Date(sub.current_period_end) > new Date();
    } catch (e) { /* treat as free */ }

    if (active) {
      hideUpsellsForMember();   // paying member → never sell to them again
    } else {
      document.body.classList.add("is-guest");
      schedulePrompt(true);     // signed in but free → prompt, checkout inline
    }
  })();
})();
