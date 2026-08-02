/* CREDIBLE — session-ui.js
   Runs on every page. Drives the topbar's three auth states:
     1. Signed out:            Sign in + Subscribe both visible (default HTML)
     2. Signed in, no sub:     profile icon replaces "Sign in"; Subscribe stays
     3. Signed in + active sub: profile icon only — Subscribe hides too
   Sign-out itself lives on account.html, not in the topbar — matches how
   most subscription publications handle it (profile icon → account page).
   Reuses the same Supabase config already set by js/auth.js. */

(function () {
  "use strict";

  var SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  var configured =
    SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  if (!configured || !window.supabase) return;

  var sb = window.CREDIBLE_SB || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.CREDIBLE_SB = sb;

  function markSignedIn(firstName) {
    document.body.classList.add("is-authed");
    document.querySelectorAll(".account-btn").forEach(function (btn) {
      btn.classList.add("show");
      btn.setAttribute("title", "Hi, " + firstName + " — view your account");
    });
  }

  function markMember() {
    document.body.classList.add("is-member");
  }

  sb.auth.getSession().then(async function (result) {
    var session = result.data && result.data.session;
    if (!session) return; // signed out — default topbar state, nothing to do

    var meta = session.user.user_metadata || {};
    var name = meta.full_name || session.user.email.split("@")[0];
    markSignedIn(name.split(" ")[0]);

    // Check subscription status — same query pattern as js/paywall.js.
    // Any failure here just leaves the reader in the "signed in, no sub"
    // state, which is the safe default (never hides the Subscribe button
    // without a positive, confirmed active subscription).
    try {
      var res = await fetch(
        SUPABASE_URL + "/rest/v1/subscriptions?user_id=eq." + session.user.id + "&select=status,current_period_end",
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + session.access_token } }
      );
      var rows = await res.json().catch(function () { return []; });
      var sub = Array.isArray(rows) ? rows[0] : null;
      var active = sub && sub.status === "active" && new Date(sub.current_period_end) > new Date();
      if (active) markMember();
    } catch (err) {
      /* Leave as signed-in-but-not-member — fail safe, not fail hidden. */
    }
  });
})();
