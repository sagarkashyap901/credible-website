// api/create-subscription.js
// Creates a Razorpay SUBSCRIPTION (₹119/month recurring) for a signed-in reader.
//
// Extra env var needed in Vercel: RAZORPAY_PLAN_ID
// (create the ₹119/month plan once in Razorpay Dashboard → Subscriptions → Plans)

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

  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Server not fully configured — check Vercel environment variables." });
  }
  if (!RAZORPAY_PLAN_ID) {
    return res.status(500).json({ error: "RAZORPAY_PLAN_ID missing — create the ₹119/month plan in Razorpay and add its ID in Vercel." });
  }

  const user = await getUserFromToken(req, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Please sign in before subscribing." });
  }

  try {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: RAZORPAY_PLAN_ID,
        total_count: 120,          // up to 120 monthly charges (10 years)
        quantity: 1,
        customer_notify: 1,
        notes: { user_id: user.id, email: user.email || "" },
      }),
    });

    const sub = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: sub.error?.description || "Razorpay subscription creation failed" });
    }

    return res.status(200).json({
      subscriptionId: sub.id,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
