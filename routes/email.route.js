const express = require("express");
const catchAsync = require("../utils/errors/catchAsync");
const sendEmail = require("../helper/sendEmail");
const router = express.Router();

router.post(
  "/send",
  catchAsync(async (req, res, next) => {
    await sendEmail({
      email: "horizonsolutions.dev4@gmail.com",
      subject: req.body.subject,
      message: req.body.message,
    });
  })
);

module.exports = router;
