/* CREDIBLE — auth.js
   Full login system powered by Supabase (free tier).
   ────────────────────────────────────────────────────────────────
   ONE-TIME SETUP (5 minutes):
   1. Go to https://supabase.com → Sign up (free) → "New project"
      · Name: credible · Region: Mumbai (ap-south-1) · Set a DB password
   2. In your project: Settings → API. Copy two values:
      · Project URL        → paste into SUPABASE_URL below
      · anon public key    → paste into SUPABASE_ANON_KEY below
   3. Authentication → Providers → Email: keep "Confirm email" ON.
      That's your email verification — Supabase sends the link
      automatically and won't activate the account until clicked.
   4. Authentication → URL Configuration → Site URL:
      https://credible-website-virid.vercel.app
      (update to https://credible.news once that domain is live)
   5. Authentication → URL Configuration → Redirect URLs: add
      https://credible-website-virid.vercel.app/reset-password.html
      This is required for the "Forgot your password?" flow — without it,
      Supabase will reject the emailed reset link. Add the credible.news
      version here too once that domain is live.
   6. Re-deploy this folder. Done.

   WHERE IS THE DATA & IS IT SECURE?
   · Stored in your own Supabase project: a managed PostgreSQL
     database hosted on AWS (choose Mumbai for Indian users).
   · Passwords are never stored as text — Supabase hashes them
     with bcrypt. Even you can't read them. Traffic is HTTPS/TLS.
   · The "anon key" below is SAFE to be public — it only allows
     what your security rules permit. Never paste the
     "service_role" key into website code.
   · You can see/export your subscriber list anytime in the
     Supabase dashboard → Authentication → Users.
   ──────────────────────────────────────────────────────────────── */

const SUPABASE_URL = "https://kwbsaazyueymeabousba.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3YnNhYXp5dWV5bWVhYm91c2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTE1NzUsImV4cCI6MjA5ODkyNzU3NX0.MngDbyt9gFexadMK7v8oi_rfMqnZlewa0IIhEyWemdg";

// Shared with js/paywall.js so both files read from one place — edit only here.
window.CREDIBLE_SUPABASE_URL = SUPABASE_URL;
window.CREDIBLE_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

(function () {
  "use strict";

  const configured =
    SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 30;

  const sb = configured
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  /* ---- Elements ---- */
  const tabs = document.querySelectorAll(".auth-tabs button");
  const signupForm = document.getElementById("signup-form");
  const signinForm = document.getElementById("signin-form");
  const forgotForm = document.getElementById("forgot-form");
  const forgotLink = document.getElementById("forgot-link");
  const backToSignin = document.getElementById("back-to-signin");
  const authTabs = document.querySelector(".auth-tabs");
  const msg = document.getElementById("auth-msg");
  const title = document.getElementById("auth-title");
  const guestPanel = document.getElementById("guest-panel");
  const memberPanel = document.getElementById("member-panel");
  const activePanel = document.getElementById("active-panel");

  /* ---- Session-aware panels: show the RIGHT view for this reader ---- */
  async function renderCorrectPanel() {
    if (!guestPanel || !memberPanel) return; // not on the subscribe page

    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      guestPanel.style.display = "block";
      memberPanel.style.display = "none";
      if (activePanel) activePanel.style.display = "none";
      return;
    }

    // Signed in — check whether their subscription is already active
    let active = false, until = null;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${session.user.id}&select=status,current_period_end`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
      );
      const rows = await res.json().catch(() => []);
      const sub = Array.isArray(rows) ? rows[0] : null;
      if (sub && sub.status === "active" && new Date(sub.current_period_end) > new Date()) {
        active = true;
        until = new Date(sub.current_period_end);
      }
    } catch (_) {}

    guestPanel.style.display = "none";

    const meta = session.user.user_metadata || {};
    const first = (meta.full_name || session.user.email.split("@")[0]).split(" ")[0];

    if (active && activePanel) {
      memberPanel.style.display = "none";
      activePanel.style.display = "block";
      const untilEl = document.getElementById("active-until");
      if (untilEl && until) untilEl.textContent = "Your membership runs until " + until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + ".";
    } else {
      memberPanel.style.display = "block";
      if (activePanel) activePanel.style.display = "none";
      const nameEl = document.getElementById("member-name");
      const emailEl = document.getElementById("member-email");
      if (nameEl) nameEl.textContent = ", " + first;
      if (emailEl) emailEl.textContent = session.user.email;
    }
  }
  renderCorrectPanel();

  function show(text, type) {
    msg.textContent = text;
    msg.className = "auth-msg show " + type;
  }

  function notConfigured() {
    show(
      "Login isn't connected yet — the site owner needs to paste the Supabase keys into js/auth.js. See setup notes in that file.",
      "err"
    );
  }

  /* ---- Tab switching ---- */
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      const mode = t.dataset.mode;
      signupForm.style.display = mode === "signup" ? "block" : "none";
      signinForm.style.display = mode === "signin" ? "block" : "none";
      title.textContent = mode === "signup" ? "Create your account" : "Welcome back";
      msg.className = "auth-msg";
    })
  );

  /* ---- Sign up (email verification link — Site URL must be set correctly
     in Supabase → Authentication → URL Configuration → Site URL) ---- */
  if (signupForm) signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!configured) return notConfigured();
    const name = document.getElementById("su-name").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const password = document.getElementById("su-password").value;

    show("Creating your account…", "ok");
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin + "/index.html"
      }
    });

    if (error) return show(error.message, "err");
    show(
      "Almost done, " + name.split(" ")[0] +
      "! We've emailed you a verification link — click it to activate your account.",
      "ok"
    );
    signupForm.reset();
  });

  /* ---- Sign in ---- */
  if (signinForm) signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!configured) return notConfigured();
    const email = document.getElementById("si-email").value.trim();
    const password = document.getElementById("si-password").value;

    show("Signing you in…", "ok");
    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      if (/confirm/i.test(error.message))
        return show("Please verify your email first — check your inbox for the link.", "err");
      return show(error.message, "err");
    }
    const first = (data.user.user_metadata.full_name || "reader").split(" ")[0];
    show("Welcome back, " + first + "! You're signed in.", "ok");
    // Immediately show the membership/checkout panel — don't navigate away
    setTimeout(renderCorrectPanel, 800);
  });

  /* ---- Forgot password ----
     "Forgot your password?" swaps the sign-in form for a one-field email
     form. Supabase emails a link that lands on reset-password.html, where
     the reader sets a new password. NOTE for Sagar: the redirect URL below
     (window.location.origin + "/reset-password.html") must be added to
     Supabase → Authentication → URL Configuration → Redirect URLs, or the
     emailed link will be rejected. Add it for both the current Vercel
     domain and credible.news once that's live. */
  if (forgotLink && forgotForm && signinForm) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      signinForm.style.display = "none";
      forgotForm.style.display = "block";
      if (authTabs) authTabs.style.display = "none";
      title.textContent = "Reset your password";
      msg.className = "auth-msg";
      const fpEmail = document.getElementById("fp-email");
      const siEmail = document.getElementById("si-email");
      if (fpEmail && siEmail && siEmail.value) fpEmail.value = siEmail.value;
    });
  }

  if (backToSignin && forgotForm && signinForm) {
    backToSignin.addEventListener("click", (e) => {
      e.preventDefault();
      forgotForm.style.display = "none";
      signinForm.style.display = "block";
      if (authTabs) authTabs.style.display = "flex";
      title.textContent = "Welcome back";
      msg.className = "auth-msg";
      forgotForm.reset();
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!configured) return notConfigured();
      const email = document.getElementById("fp-email").value.trim();

      show("Sending reset link…", "ok");
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password.html"
      });

      // Deliberately the same message whether or not the email exists —
      // this is how Supabase's own endpoint behaves, and it keeps us from
      // leaking which emails have accounts on Credible.
      if (error && !/rate limit/i.test(error.message)) {
        show(error.message, "err");
        return;
      }
      show(
        "If an account exists for " + email + ", a password reset link is on its way. Check your inbox (and spam folder) — the link expires in 1 hour.",
        "ok"
      );
      forgotForm.reset();
    });
  }
})();
