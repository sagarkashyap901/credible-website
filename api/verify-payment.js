// api/verify-payment.js
// Confirms the payment is genuine (Razorpay signs every successful payment;
// only someone holding your SECRET key could forge this), then marks the
// reader as an active subscriber in Supabase for 30 days.
//
// ONE-TIME SETUP: In Vercel → Settings → Environment Variables, also add:
//   SUPABASE_URL                (same value as in js/auth.js)
//   SUPABASE_SERVICE_ROLE_KEY   (Supabase → Settings → API → "service_role" secret —
//                                 NOT the anon key. This one must stay server-side only.)
//
// Also run the SQL in supabase-subscriptions-table.sql once, in your Supabase
// project's SQL Editor, to create the table this function writes to.

import crypto from "crypto";

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

  // Recreate Razorpay's signature ourselves. If it doesn't match byte-for-byte,
  // the payment payload was tampered with or never happened.
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?on_conflict=user_id`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_id: userId,
        email: userEmail || null,
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
