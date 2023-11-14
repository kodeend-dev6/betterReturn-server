const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  createNewUser,
  userLogin,
  forgotPassword,
  verifyEmail,
  resetPassword,
  googleLoginCallback,
  verifyForgotPasswordOTP,
} = require("../controllers/auth.controller");

router.post("/registration", createNewUser);
router.post("/login", userLogin);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);
router.post("/reset-password", resetPassword);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  googleLoginCallback
);

module.exports = router;
