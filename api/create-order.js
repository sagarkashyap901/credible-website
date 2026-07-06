// api/create-order.js
// Vercel serverless function. Runs on Vercel's servers, never in the browser —
// this is the only safe place to use your Razorpay SECRET key.
//
// ONE-TIME SETUP: In your Vercel project → Settings → Environment Variables, add:
//   RAZORPAY_KEY_ID      (from Razorpay Dashboard → Settings → API Keys)
//   RAZORPAY_KEY_SECRET  (same page — shown once, copy it immediately)
// Redeploy after adding env vars for them to take effect.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({
      error: "Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel project settings.",
    });
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
        amount: 11900, // ₹119.00 in paise — Razorpay always takes the smallest currency unit
        currency: "INR",
        receipt: `credible_${Date.now()}`,
        notes: { plan: "monthly_membership" },
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
      keyId: RAZORPAY_KEY_ID, // safe to send to the browser — this is the public key
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
