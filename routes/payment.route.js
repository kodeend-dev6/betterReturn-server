const express = require("express");
const {
  paymentCheckout,
  createSubscription,
  stripeWebhook,
  cancelSubscription,
} = require("../controllers/payment.controller");
const router = express.Router();

router.post("/checkout", paymentCheckout);
router.post("/subscription", createSubscription);
router.post("/cancel-subscription", cancelSubscription);

// Stripe Webhook
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   stripeWebhook
// );

module.exports = router;
