const express = require("express");
const router = express.Router();

const {
  createNewUser,
  userLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/auth.controller");

router.post("/registration", createNewUser);
router.post("/login", userLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
