const express = require("express");
const catchAsync = require("../utils/errors/catchAsync");
const sendEmail = require("../helper/sendEmail");
const router = express.Router();
const sendResponse = require("../utils/sendResponse");
const createEvent = require("../helper/createEvent");

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

module.exports = router;
