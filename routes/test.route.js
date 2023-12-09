const express = require("express");
const catchAsync = require("../utils/errors/catchAsync");

const router = express.Router();
const sendResponse = require("../utils/sendResponse");
const sendSMS = require("../utils/sendSMS");
const sendNodeEmail = require("../helper/email/sendNodeEmail");
const emailVerificationTemplate = require("../helper/email/emailVerificationTemplate");

router.post(
  "/sms",
  catchAsync(async (req, res, next) => {
    const { phone, message } = req.body;
    const response = await sendSMS({ phone, message });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "SMS sent successfully",
      data: response,
    });
  })
);

router.post(
  "/send-email",
  catchAsync(async (req, res, next) => {
    const { email, subject, otp } = req.body;
    await sendNodeEmail({
      email,
      subject,
      html: emailVerificationTemplate({ otp }),
    });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "SMS sent successfully",
    });
  })
);

module.exports = router;
