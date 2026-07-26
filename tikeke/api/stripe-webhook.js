export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.client_reference_id;

      if (uid) {
        const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/tikeke-a91b8/databases/(default)/documents";
        await fetch(`${FIRESTORE_URL}/users/${uid}?updateMask.fieldPaths=isPremium`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: { isPremium: { booleanValue: true } }
          })
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Erè entèn" });
  }
}
