const express = require("express");
const {
  paymentCheckout,
  createSubscription,
  stripeWebhook,
} = require("../controllers/payment.controller");
const router = express.Router();

router.post("/checkout", paymentCheckout);
router.post("/subscription", createSubscription);

// Stripe Webhook
router.post("/webhook", stripeWebhook);

module.exports = router;
