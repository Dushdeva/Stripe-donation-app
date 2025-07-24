const express = require('express');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const stripeLib = require('stripe');

dotenv.config();
const app = express();
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
const endpointSecret = "whsec_9f7e09af8e1273e326d8a772f36420391113d1ef2e4a0b8686a909a1918c5085";

// Normal middleware
app.use(cors());
app.use(express.json());  // ✅ Only for regular routes
app.use(express.static("public"));

// Regular route
app.post("/create-payment-intent", async (req, res) => {
  const { amount, email } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: parseInt(amount) * 100,
    currency: "inr",
    metadata: { email }
  });
  res.send({ clientSecret: paymentIntent.client_secret });
});

// Webhook route with raw body
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], endpointSecret);
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const data = {
      email: paymentIntent.metadata.email,
      amount: paymentIntent.amount,
      id: paymentIntent.id,
      time: new Date().toISOString()
    };
    const donations = JSON.parse(fs.readFileSync("donations.json", "utf8"));
    donations.push(data);
    fs.writeFileSync("donations.json", JSON.stringify(donations, null, 2));
    console.log("✅ Payment confirmed and stored:", data);
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
