// api/create-order.js
// Creates a Razorpay order for ₹119. Hardened:
// - Requires a valid logged-in Supabase session (Authorization: Bearer <token>)
// - Secret keys never leave the server.
//
// Env vars required in Vercel: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Server not fully configured — check Vercel environment variables." });
  }

  // Only signed-in readers can start a checkout.
  const user = await getUserFromToken(req, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Please sign in before subscribing." });
  }

  try {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 11900, // ₹119.00 in paise
        currency: "INR",
        receipt: `credible_${Date.now()}`,
        notes: { plan: "monthly_membership", user_id: user.id },
      }),
    });

    const order = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: order.error?.description || "Razorpay order creation failed" });
    }

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
