/* CREDIBLE — account.js
   Powers account.html. Reads the signed-in user from Supabase and shows
   their real profile + membership details. Runs only on the account page.

   Shows:
   · Name, email, member-since date, email-verified status
   · Membership status (Member / Free account), renewal date, last payment ID
   · Subscribe button for free accounts; sign-out for everyone
*/

(function () {
  "use strict";

  var loadingEl   = document.getElementById("account-loading");
  var signedOutEl = document.getElementById("account-signedout");
  var contentEl   = document.getElementById("account-content");

  // Not on the account page — do nothing.
  if (!loadingEl || !contentEl) return;

  var SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  var configured =
    SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  function showSignedOut() {
    loadingEl.style.display = "none";
    contentEl.style.display = "none";
    signedOutEl.style.display = "block";
  }

  if (!configured || !window.supabase) return showSignedOut();

  var sb = window.CREDIBLE_SB || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.CREDIBLE_SB = sb;

  function fmtDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      });
    } catch (e) { return "—"; }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHTML(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  (async function render() {
    var sessionResult;
    try {
      sessionResult = await sb.auth.getSession();
    } catch (e) {
      return showSignedOut();
    }

    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    if (!session) return showSignedOut();

    var user = session.user;
    var meta = user.user_metadata || {};

    /* ---- Profile ---- */
    setText("acc-name", meta.full_name || "—");
    setText("acc-email", user.email || "—");
    setText("acc-since", fmtDate(user.created_at));
    setHTML(
      "acc-verified",
      user.email_confirmed_at
        ? '<span class="account-badge active"><span class="dot-i"></span>Verified</span>'
        : '<span class="account-badge free"><span class="dot-i"></span>Not verified</span>'
    );

    /* ---- Membership ---- */
    var active = false, sub = null;
    try {
      var res = await fetch(
        SUPABASE_URL + "/rest/v1/subscriptions?user_id=eq." + user.id +
          "&select=status,current_period_end,razorpay_payment_id",
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: "Bearer " + session.access_token
          }
        }
      );
      var rows = await res.json().catch(function () { return []; });
      sub = Array.isArray(rows) ? rows[0] : null;
      active =
        sub &&
        sub.status === "active" &&
        new Date(sub.current_period_end) > new Date();
    } catch (e) {
      /* treat as free account */
    }

    if (active) {
      setHTML(
        "acc-status",
        '<span class="account-badge active"><span class="dot-i"></span>Member</span>'
      );
      setText("acc-renews", fmtDate(sub.current_period_end));
      var rowRenews = document.getElementById("row-renews");
      var rowPlan = document.getElementById("row-plan");
      if (rowRenews) rowRenews.style.display = "flex";
      if (rowPlan) rowPlan.style.display = "flex";

      if (sub.razorpay_payment_id) {
        setText("acc-payid", sub.razorpay_payment_id);
        var rowPay = document.getElementById("row-payid");
        if (rowPay) rowPay.style.display = "flex";
      }
    } else {
      setHTML(
        "acc-status",
        '<span class="account-badge free"><span class="dot-i"></span>Free account</span>'
      );
      var upsell = document.getElementById("account-upsell");
      if (upsell) upsell.style.display = "block";
    }

    /* ---- Sign out ---- */
    var signoutBtn = document.getElementById("acc-signout");
    if (signoutBtn) {
      signoutBtn.addEventListener("click", async function () {
        signoutBtn.textContent = "Signing out…";
        signoutBtn.disabled = true;
        await sb.auth.signOut();
        window.location.href = "index.html";
      });
    }

    loadingEl.style.display = "none";
    contentEl.style.display = "block";
  })();
})();
