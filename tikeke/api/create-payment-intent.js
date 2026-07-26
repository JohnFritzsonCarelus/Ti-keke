// Fichye sa a dwe rete nan: tikeke/api/create-payment-intent.js
// (kreye yon nouvo dosye ki rele "api" nan rasin pwojè a, si li pa egziste)

export default async function handler(req, res) {
  // Otorize sèlman rekèt POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency, plan } = req.body;

    // Verifikasyon debaz
    if (!amount || !currency) {
      return res.status(400).json({ error: "Montan ak deviz obligatwa" });
    }

    // Rele API Stripe dirèkteman ak fetch (san SDK, pi senp pou Vercel)
    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: amount.toString(), // an santim (egzanp 999 pou $9.99)
        currency: currency,
        "metadata[plan]": plan || "premium",
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // Voye "client_secret" la bay frontend la (App.jsx) pou l ka fini peman an
    return res.status(200).json({ clientSecret: data.client_secret });

  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Erè entèn sèvè a" });
  }
}
