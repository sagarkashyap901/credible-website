// api/razorpay-webhook.js
// Razorpay calls this URL automatically every month when a renewal charge
// succeeds (or a subscription is cancelled/paused). This is what keeps
// members active month after month WITHOUT them doing anything.
//
// Extra env var needed in Vercel: RAZORPAY_WEBHOOK_SECRET
// (set when creating the webhook in Razorpay Dashboard → Webhooks)

import crypto from "crypto";

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { RAZORPAY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!RAZORPAY_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Webhook not configured." });
  }

  // 1. Verify the webhook genuinely came from Razorpay.
  const rawBody = await readRawBody(req);
  const signature = req.headers["x-razorpay-signature"] || "";
  const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  if (expected !== signature) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return res.status(400).json({ error: "Bad payload" }); }

  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  const subEntity = event.payload?.subscription?.entity;
  const payEntity = event.payload?.payment?.entity;
  const subId = subEntity?.id;
  if (!subId) return res.status(200).json({ received: true }); // event we don't care about

  try {
    if (event.event === "subscription.charged") {
      // Monthly renewal succeeded → extend access.
      // Razorpay provides current_end as a unix timestamp for the cycle end.
      const periodEnd = subEntity.current_end
        ? new Date(subEntity.current_end * 1000).toISOString()
        : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

      await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?razorpay_subscription_id=eq.${encodeURIComponent(subId)}`, {
        method: "PATCH",
        headers: sbHeaders,
        body: JSON.stringify({
          status: "active",
          current_period_end: periodEnd,
          razorpay_payment_id: payEntity?.id || null,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    if (["subscription.cancelled", "subscription.halted", "subscription.paused"].includes(event.event)) {
      // Stop future renewals; access naturally lapses at current_period_end.
      await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?razorpay_subscription_id=eq.${encodeURIComponent(subId)}`, {
        method: "PATCH",
        headers: sbHeaders,
        body: JSON.stringify({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
