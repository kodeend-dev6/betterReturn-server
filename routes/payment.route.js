const express = require("express");
const {
  paymentCheckout,
  createSubscription,
  cancelSubscription,
  getSubscriptionPlans,
} = require("../controllers/payment.controller");
const router = express.Router();

router.get("/get-plans", getSubscriptionPlans);
router.post("/checkout", paymentCheckout);
router.post("/subscription", createSubscription);
router.post("/cancel-subscription", cancelSubscription);

module.exports = router;
