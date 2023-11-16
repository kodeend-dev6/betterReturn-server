const express = require("express");
const { paymentCheckout } = require("../controllers/payment.controller");
const router = express.Router();

router.post("/checkout", paymentCheckout);

module.exports = router;
