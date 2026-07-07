// api/verify-payment.js
// Verifies Razorpay's payment signature, then activates the subscriber. Hardened:
// - Requires a valid logged-in Supabase session; the session user MUST match userId
// - Replay protection: one payment can only ever activate one account
//
// Env vars: RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import crypto from "crypto";

async function getUserFromToken(req, supabaseUrl, serviceKey) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, userEmail } = req.body || {};
  const { RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Server not fully configured — check Vercel environment variables." });
  }

  // 1. The caller must be signed in, and can only activate THEIR OWN account.
  const user = await getUserFromToken(req, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Please sign in." });
  }
  if (user.id !== userId) {
    return res.status(403).json({ error: "Session does not match the account being activated." });
  }

  // 2. Cryptographic proof the payment is real.
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    // 3. Replay protection: has this payment already activated an account?
    const dupCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}&select=user_id`,
      { headers: sbHeaders }
    );
    const dupRows = await dupCheck.json().catch(() => []);
    if (Array.isArray(dupRows) && dupRows.length > 0) {
      return res.status(409).json({ error: "This payment has already been used to activate a subscription." });
    }

    // 4. Activate for 30 days.
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?on_conflict=user_id`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: userId,
        email: userEmail || user.email || null,
        status: "active",
        current_period_end: periodEnd,
        razorpay_payment_id,
        razorpay_order_id,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!upsert.ok) {
      const detail = await upsert.text();
      return res.status(500).json({ error: "Payment verified but activation failed", detail });
    }

    return res.status(200).json({ success: true, expiresAt: periodEnd });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
