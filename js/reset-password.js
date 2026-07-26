/* CREDIBLE — reset-password.js
   Powers reset-password.html — the page Supabase's "forgot password"
   email links to. Creates its own Supabase client rather than assuming
   js/auth.js's internal one is available, since that file's setup is
   scoped to the subscribe.html sign-in/sign-up forms.

   Flow:
   1. Reader clicks the emailed link → lands here with a recovery token
      in the URL. supabase-js (loaded with detectSessionInUrl on by
      default) reads that token automatically and fires a
      PASSWORD_RECOVERY auth event.
   2. We listen for that event before showing the "set a new password"
      form — this is what stops someone from landing on this page
      directly (with no valid token) and being able to "reset" nothing.
   3. On submit, sb.auth.updateUser({ password }) changes the password
      for the now-authenticated (via the recovery token) session. */

(function () {
  "use strict";

  var SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  var configured =
    SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  var checkingEl = document.getElementById("reset-checking");
  var invalidEl = document.getElementById("reset-invalid");
  var doneEl = document.getElementById("reset-done");
  var form = document.getElementById("reset-form");
  var msgEl = document.getElementById("auth-msg");

  function show(text, type) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = "auth-msg show " + type;
  }

  function showInvalid() {
    if (checkingEl) checkingEl.style.display = "none";
    if (form) form.style.display = "none";
    if (invalidEl) invalidEl.style.display = "block";
  }

  function showForm() {
    if (checkingEl) checkingEl.style.display = "none";
    if (invalidEl) invalidEl.style.display = "none";
    if (form) form.style.display = "block";
  }

  if (!configured || !window.supabase) {
    showInvalid();
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  var linkConfirmed = false;

  // Fires once supabase-js has parsed a valid recovery token from the URL.
  sb.auth.onAuthStateChange(function (event) {
    if (event === "PASSWORD_RECOVERY") {
      linkConfirmed = true;
      showForm();
    }
  });

  // Fallback: if the token was already processed before this listener
  // attached (or the reader refreshed the page after landing here once),
  // an existing recovery session still counts as valid.
  sb.auth.getSession().then(function (result) {
    var session = result.data && result.data.session;
    if (!linkConfirmed && session) {
      linkConfirmed = true;
      showForm();
    }
  });

  // If nothing confirms a valid link within a few seconds, the token was
  // missing, malformed, already used, or expired — show the fallback.
  setTimeout(function () {
    if (!linkConfirmed) showInvalid();
  }, 4000);

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var pw = document.getElementById("new-password").value;
      var confirm = document.getElementById("confirm-password").value;

      if (pw.length < 8) return show("Password must be at least 8 characters.", "err");
      if (pw !== confirm) return show("Those passwords don't match.", "err");

      var btn = form.querySelector("button[type=submit]");
      var original = btn.textContent;
      btn.textContent = "Updating…";
      btn.disabled = true;

      const { error } = await sb.auth.updateUser({ password: pw });

      if (error) {
        show(error.message, "err");
        btn.textContent = original;
        btn.disabled = false;
        return;
      }

      form.style.display = "none";
      if (doneEl) doneEl.style.display = "block";
      if (msgEl) msgEl.className = "auth-msg";
    });
  }
})();
