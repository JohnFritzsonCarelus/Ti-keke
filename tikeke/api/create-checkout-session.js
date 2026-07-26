export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { amount, planName, uid } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Montan obligatwa" });
    }
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("payment_method_types[]", "card");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", planName || "Ti Kèkè Premium");
    params.append("line_items[0][price_data][unit_amount]", amount.toString());
    params.append("line_items[0][price_data][recurring][interval]", "month");
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", "https://ti-keke.vercel.app/?payment=success");
    params.append("cancel_url", "https://ti-keke.vercel.app/?payment=cancel");
    if (uid) params.append("client_reference_id", uid);
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: "Erè entèn sèvè a" });
  }
}
