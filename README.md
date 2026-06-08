# 💳 Stripe Donation App

> **Node.js · Express · Stripe Payments API · Webhook Verification · Payment Intents**

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)
![Stripe](https://img.shields.io/badge/Stripe-Payments%20API-635BFF?logo=stripe)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

---

## 📌 Project Overview

A full-stack donation platform integrating the **Stripe Payments API** with a Node.js/Express backend. Donors enter an amount and card details on a clean frontend; the server creates a PaymentIntent, processes the charge securely via Stripe.js Elements, and confirms the payment through a **cryptographically verified webhook** — storing confirmed donations persistently.

This project demonstrates the correct, production-safe Stripe integration pattern: client-side card capture via Stripe Elements (card data never touches your server), server-side PaymentIntent creation, and webhook signature verification to confirm payment success.

---

## 🏗️ Architecture

```
Browser (index.html + Stripe.js)
          │
          │  1. POST /create-payment-intent (amount, email)
          ▼
   Express Server (server.js)
          │
          │  2. stripe.paymentIntents.create()
          ▼
     Stripe API
          │
          │  3. Returns client_secret
          ▼
   Browser confirms card payment
   via stripe.confirmCardPayment()
          │
          │  4. Stripe fires webhook → POST /webhook
          ▼
   Express verifies HMAC signature
   stripe.webhooks.constructEvent()
          │
          │  5. On payment_intent.succeeded
          ▼
   donations.json (persistent storage)
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💳 Card Payments | Stripe Elements — card data captured client-side, never touches your server |
| 🔐 Webhook Verification | HMAC-SHA256 signature validation via `stripe.webhooks.constructEvent()` |
| 📋 Payment Intents | Server-side PaymentIntent creation with donor email metadata |
| 💾 Persistent Storage | Confirmed donations saved to `donations.json` with full transaction details |
| 🛡️ Raw Body Parsing | `/webhook` route uses `express.raw()` — required for Stripe signature verification |
| 🌐 CORS Enabled | Cross-origin requests supported for frontend/backend separation |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-payment-intent` | Creates Stripe PaymentIntent, returns `client_secret` |
| POST | `/webhook` | Receives Stripe events, verifies signature, stores confirmed donations |

### `/create-payment-intent` — Request Body
```json
{
  "amount": 500,
  "email": "donor@example.com"
}
```

### `/create-payment-intent` — Response
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### Stored Donation Record (`donations.json`)
```json
{
  "email": "donor@example.com",
  "amount": 50000,
  "id": "pi_3abc123xyz",
  "time": "2026-06-08T12:00:00.000Z"
}
```
> Amount stored in **paise** (Stripe standard) — ₹500 = 50000 paise

---

## 📁 Repository Structure

```
Stripe-donation-app/
│
├── server.js           # Express server — PaymentIntent + webhook handler
├── donations.json      # Persistent donation log (auto-created)
├── package.json
├── .env                # Stripe secret key (never commit this)
│
└── public/
    └── index.html      # Donation form with Stripe.js Elements
```

---

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- A [Stripe account](https://stripe.com) (free)
- Stripe CLI (for local webhook testing)

### 1. Clone & Install

```bash
git clone https://github.com/Dushdeva/Stripe-donation-app.git
cd Stripe-donation-app
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

In `server.js`, update the webhook secret:
```javascript
const endpointSecret = "whsec_your_webhook_secret_here";
```

### 3. Run the Server

```bash
node server.js
# Server running on http://localhost:3000
```

### 4. Test Webhooks Locally (Stripe CLI)

```bash
stripe listen --forward-to localhost:3000/webhook
```

This gives you a local `whsec_` secret for testing — replace `endpointSecret` with it.

### 5. Test Payment

Open **http://localhost:3000** and use Stripe test card:
```
Card Number : 4242 4242 4242 4242
Expiry      : Any future date
CVC         : Any 3 digits
```

---

## 🔐 Key Implementation Detail — Why Raw Body Parsing?

```javascript
// ✅ Correct — /webhook MUST use express.raw()
app.post("/webhook", express.raw({ type: "application/json" }), handler);

// ❌ Wrong — express.json() modifies the body, breaking HMAC verification
app.use(express.json()); // applies to all OTHER routes only
```

Stripe signs the raw request body with HMAC-SHA256. If Express parses it as JSON first, the signature check fails. This project correctly applies `express.raw()` only on the `/webhook` route.

---

## 🔮 Identified Improvements

- [ ] **Move to database** — replace `donations.json` with PostgreSQL or MongoDB for concurrent writes
- [ ] **Add `.env` validation** — fail fast on missing `STRIPE_SECRET_KEY` at startup
- [ ] **Idempotency** — check `payment_intent.id` before writing to prevent duplicate records on webhook retries
- [ ] **Admin dashboard** — display donation history via a `/donations` GET endpoint
- [ ] **Deploy to Render** — make live with environment variables set in dashboard

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Server | Node.js + Express |
| Payments | Stripe Payments API (Payment Intents) |
| Card capture | Stripe.js Elements (client-side) |
| Webhook security | HMAC-SHA256 via `stripe.webhooks.constructEvent()` |
| Storage | JSON file (`donations.json`) |
| Config | `dotenv` |

---

*Built by [Devang Yadav](https://github.com/Dushdeva) — B.Tech CSE (AI), SKIT Jaipur*
