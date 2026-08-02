/* CREDIBLE — paywall.js
   Runs only on pages with <body data-premium="true">.
   Free articles (no data-premium, or data-premium="false") are untouched.

   FAIL-CLOSED DESIGN (25 Jul 2026): premium content is hidden and the
   "Members Only" gate is shown by CSS the moment the page loads — before
   this script even runs. This script's only job is to add the
   .paywall-unlocked class to <body>, and ONLY after positively confirming
   an active subscription. If anything fails along the way (not signed in,
   no active row, a network error), the page simply stays in its default
   locked state. There is no code path that shows premium content by
   accident — the old version did the opposite (visible by default, hidden
   only after an async check succeeded) and a script failure or slow
   network could leave a premium article fully readable for free.
   Uses the same SUPABASE_URL / SUPABASE_ANON_KEY already configured in js/auth.js. */

(function () {
  "use strict";

  const isPremiumPage = document.body.dataset.premium === "true";

  const SUPABASE_URL = window.CREDIBLE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.CREDIBLE_SUPABASE_ANON_KEY;
  const configured = SUPABASE_URL && SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 30;

  if (!configured || !window.supabase) return; // payments/login not wired up yet

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.CREDIBLE_SB = sb;

  /* ---- Content gating: only runs on articles marked data-premium="true" ----
     CSS (see style.css §22) hides premium content and shows the gate by
     DEFAULT the instant the page loads — this code's only job is to add
     .paywall-unlocked to <body> if, and only if, it can positively confirm
     an active subscription. Any failure (no session, no active row, a
     network error, Supabase being unreachable) simply leaves the page in
     its default locked state — there is no path that unlocks by accident. */
  if (isPremiumPage) {
    function unlock() {
      document.body.classList.add("paywall-unlocked");
    }

    (async function checkAccess() {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;

        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${session.user.id}&select=status,current_period_end`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
        );
        const rows = await res.json().catch(() => []);
        const sub = Array.isArray(rows) ? rows[0] : null;
        const active = sub && sub.status === "active" && new Date(sub.current_period_end) > new Date();
        if (active) unlock();
      } catch (err) {
        /* Fail closed: any error during the check leaves the article locked. */
      }
    })();
  }

  /* ---- Checkout: works on ANY page with a [data-checkout] element ----
     These are now real <a href="/subscribe.html"> links, not bare
     <button>s — if this script never runs (blocked, errored, Supabase
     unreachable) the native link still takes the reader to the Subscribe
     page. When JS does run, we intercept the click to either redirect to
     Subscribe (no session) or open Razorpay directly (already signed in).
     Root-relative "/subscribe.html" is used everywhere here — a bare
     "subscribe.html" previously 404'd when clicked from inside /articles/,
     since the relative path resolved against the wrong folder. */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-checkout]");
    if (!btn) return;
    e.preventDefault();

    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = "/subscribe.html";
      return;
    }

    const original = btn.textContent;
    /* btn.disabled is a no-op on <a> elements (article checkout links) —
       pointer-events + aria-disabled works for both <a> and <button>. */
    function setBusy(busy) {
      btn.disabled = busy; // still correct for <button> on subscribe.html
      btn.style.pointerEvents = busy ? "none" : "";
      if (busy) btn.setAttribute("aria-disabled", "true");
      else btn.removeAttribute("aria-disabled");
    }
    btn.textContent = "Loading…";
    setBusy(true);

    try {
      const subRes = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.access_token }
      });
      const sub = await subRes.json();
      if (!subRes.ok) throw new Error(sub.error || "Could not start checkout");

      const rzp = new window.Razorpay({
        key: sub.keyId,
        subscription_id: sub.subscriptionId,
        name: "Credible",
        description: "Monthly Membership — ₹89/month (25% launch offer), renews automatically",
        prefill: { email: session.user.email },
        theme: { color: "#2430ff" },
        handler: async function (response) {
          btn.textContent = "Verifying…";
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + session.access_token
            },
            body: JSON.stringify({
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: session.user.id,
              userEmail: session.user.email,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            window.location.reload();
          } else {
            alert("Payment went through, but activation failed: " + (result.error || "unknown error") + ". Contact support with your payment ID: " + response.razorpay_payment_id);
          }
        },
        modal: {
          ondismiss: function () {
            btn.textContent = original;
            setBusy(false);
          },
        },
      });
      rzp.open();
    } catch (err) {
      alert(err.message);
      btn.textContent = original;
      setBusy(false);
    }
  });
})();
