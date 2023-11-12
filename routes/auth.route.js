const express = require("express");
const router = express.Router();

const {
  createNewUser,
  userLogin,
  forgetPassword,
  resetPassword,
} = require("../controllers/auth.controller");

router.post("/registration", createNewUser);
router.post("/login", userLogin);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
