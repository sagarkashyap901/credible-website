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
    setTimeout(() => (window.location.href = "index.html"), 1200);
  });
})();
