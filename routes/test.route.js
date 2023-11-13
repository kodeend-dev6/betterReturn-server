const express = require("express");
const catchAsync = require("../utils/errors/catchAsync");
const sendEmail = require("../helper/sendEmail");
const router = express.Router();
const sendResponse = require("../utils/sendResponse");
const createEvent = require("../helper/createEvent");
const sendSMS = require("../utils/sendSMS");
const sendNodeEmail = require("../helper/email/sendNodeEmail");

router.post(
  "/send",
  catchAsync(async (req, res, next) => {
    await sendEmail({
      email: "tohak29665@newnime.com",
      subject: req.body.subject,
      message: req.body.message,
    });

    const response = await createEvent({
      email: "tohak29665@newnime.com",
    });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Email sent successfully",
      data: response,
    });
  })
);

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
    await sendNodeEmail({ email, subject, otp });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "SMS sent successfully",
    });
  })
);

module.exports = router;
