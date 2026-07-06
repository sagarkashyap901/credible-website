/* CREDIBLE — paywall.js
   Runs only on pages with <body data-premium="true">.
   Free articles (no data-premium, or data-premium="false") are untouched.

   Flow:
   1. Is the reader signed in? (uses the same Supabase project as js/auth.js)
   2. If yes, do they have an active subscription row in the `subscriptions` table?
   3. If either answer is "no" — hide the hero image, body, related stories and
      end-of-article CTA, and show the "Members Only" block instead.
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

  /* ---- Content gating: only runs on articles marked data-premium="true" ---- */
  if (isPremiumPage) {
    const gate = document.querySelector("[data-paywall-block]");
    const hideOnLock = document.querySelectorAll(
      ".article-hero, .prose, .figure, .related, .article-end, .cta:not(.paywall-gate)"
    );

    function lock() {
      hideOnLock.forEach((el) => (el.style.display = "none"));
      if (gate) gate.style.display = "block";
    }

    (async function checkAccess() {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return lock();

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${session.user.id}&select=status,current_period_end`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
      );
      const rows = await res.json().catch(() => []);
      const sub = Array.isArray(rows) ? rows[0] : null;
      const active = sub && sub.status === "active" && new Date(sub.current_period_end) > new Date();
      if (!active) lock();
    })();
  }

  /* ---- Checkout: works on ANY page with a [data-checkout] button — ---- */
  /* ---- articles, the Subscribe page, wherever "Subscribe — ₹119" appears ---- */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-checkout]");
    if (!btn) return;
    e.preventDefault();

    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = "subscribe.html";
      return;
    }

    const original = btn.textContent;
    btn.textContent = "Loading…";
    btn.disabled = true;

    try {
      const orderRes = await fetch("/api/create-order", { method: "POST" });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not start checkout");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Credible",
        description: "Monthly Membership — ₹119/month",
        prefill: { email: session.user.email },
        theme: { color: "#2430ff" },
        handler: async function (response) {
          btn.textContent = "Verifying…";
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
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
            btn.disabled = false;
          },
        },
      });
      rzp.open();
    } catch (err) {
      alert(err.message);
      btn.textContent = original;
      btn.disabled = false;
    }
  });
})();
