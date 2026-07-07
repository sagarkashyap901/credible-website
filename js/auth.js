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
      https://credible-media.netlify.app
   5. Re-deploy this folder to Netlify. Done.

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
  signupForm.addEventListener("submit", async (e) => {
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
  signinForm.addEventListener("submit", async (e) => {
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
})();
