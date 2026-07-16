/* CREDIBLE — session-ui.js
   Runs on every page. If the reader is signed in, swaps the "Sign in" /
   "Subscribe" buttons in the topbar for their name and a Sign out link.
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

  function renderSignedIn(firstName) {
    document.body.classList.add("is-authed");

    document.querySelectorAll(".topbar-actions, .masthead-actions").forEach(function (actions) {
      var signInBtn = actions.querySelector(".btn-ghost");
      var subscribeBtn = actions.querySelector(".btn-accent");
      var acctBtn = actions.querySelector(".account-btn");

      // "Sign in" becomes a working link to the reader's account page.
      if (signInBtn) {
        signInBtn.textContent = "Hi, " + firstName;
        signInBtn.setAttribute("href", "account.html");
        signInBtn.setAttribute("title", "View your account");
        signInBtn.style.cursor = "pointer";
      }

      // Compact profile icon — the mobile equivalent of "Hi, Name" above.
      // CSS only actually displays this below 860px; harmless if shown
      // elsewhere since it's just a second link to the same page.
      if (acctBtn) {
        acctBtn.classList.add("show");
      }

      if (subscribeBtn) {
        subscribeBtn.textContent = "Sign out";
        subscribeBtn.setAttribute("href", "#");
        subscribeBtn.addEventListener("click", async function (e) {
          e.preventDefault();
          await sb.auth.signOut();
          window.location.href = "index.html";
        });
      }
    });
  }

  sb.auth.getSession().then(function (result) {
    var session = result.data && result.data.session;
    if (!session) return;
    var meta = session.user.user_metadata || {};
    var name = meta.full_name || session.user.email.split("@")[0];
    renderSignedIn(name.split(" ")[0]);
  });
})();
