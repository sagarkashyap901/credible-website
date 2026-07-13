// api/cancel-subscription.js
// Lets a signed-in member cancel their own Razorpay subscription.
//
// IMPORTANT — cancels at the END of the current billing cycle, not immediately.
// This matches the Refund Policy: no refund for the current period, but the
// member keeps access until the period they already paid for runs out.
//
// Flow:
//   1. Verify the caller is signed in (Supabase JWT).
//   2. Look up THEIR OWN subscription row (service role, filtered by their user id).
//   3. Tell Razorpay to cancel at cycle end.
//   4. Mark cancel_at_period_end = true in Supabase. Status stays "active"
//      so the paywall keeps letting them read until current_period_end.
//   5. When the cycle actually ends, Razorpay fires subscription.cancelled →
//      api/razorpay-webhook.js flips status to "cancelled" → access lapses.

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

  const {
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  } = process.env;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Server not fully configured." });
  }

  // 1. Who is asking?
  const user = await getUserFromToken(req, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Please sign in." });
  }

  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    // 2. Fetch ONLY this user's subscription. They cannot touch anyone else's.
    const lookup = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&select=razorpay_subscription_id,status,current_period_end,cancel_at_period_end`,
      { headers: sbHeaders }
    );
    const rows = await lookup.json().catch(() => []);
    const sub = Array.isArray(rows) ? rows[0] : null;

    if (!sub || !sub.razorpay_subscription_id) {
      return res.status(404).json({ error: "No active subscription found on this account." });
    }
    if (sub.cancel_at_period_end) {
      return res.status(200).json({
        success: true,
        alreadyScheduled: true,
        accessUntil: sub.current_period_end,
      });
    }

    // 3. Ask Razorpay to cancel at the end of the paid cycle.
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const rzpRes = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(sub.razorpay_subscription_id)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      }
    );

    const rzp = await rzpRes.json().catch(() => ({}));
    if (!rzpRes.ok) {
      const msg = rzp?.error?.description || "Razorpay could not cancel this subscription.";
      return res.status(rzpRes.status).json({ error: msg });
    }

    // 4. Flag it locally. Status stays "active" — access continues to period end.
    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}`, {
      method: "PATCH",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      }),
    });

    return res.status(200).json({
      success: true,
      accessUntil: sub.current_period_end,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
