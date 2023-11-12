const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require("axios");
const bcrypt = require("bcrypt");
const emailCheck = require("../helper/emailCheck");
const ApiError = require("../utils/errors/ApiError");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const { getToken } = require("../middleware/token");

const crypto = require("crypto");
const { authenticateUser, findUser } = require("../helper/user.helper");

// User Registration
const createNewUser = catchAsync(async (req, res) => {
  const { fields } = req.body;

  const { Email, Name, Password, Country_code, Country, Mobile } = fields;

  if (!Email || !Name || !Password || !Country_code || !Country || !Mobile) {
    throw new ApiError(
      400,
      "Missing email, name, password, country, country_code or mobile"
    );
  }

  const hashedPassword = await bcrypt.hash(Password, 10);

  fields.Password = hashedPassword;

  // Check if the email already exists
  const emailExists = await emailCheck.isUserEmailExists(Email);

  if (emailExists) {
    throw new ApiError(403, "User already exists with this email");
  }

  const data = { fields };

  const response = await axios.post(userTable, data, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  // const emailResponse = await sendEmail({
  //   email: response?.data?.fields?.Email,
  //   subject: "Email Verification",
  // });

  // console.log(emailResponse);

  delete response?.data?.fields?.Password;

  const accessToken = getToken({
    id: response.data.id,
    email: response.data.fields.Email,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: { accessToken, ...response.data },
  });
});

// User Login
const userLogin = catchAsync(async (req, res, next) => {
  const { isAuthenticated, data } = await authenticateUser(req.body);

  if (!isAuthenticated) {
    throw new ApiError(401, "Email or Password mismatched!");
  }

  const accessToken = getToken({
    id: data?.id,
    email: data?.fields?.Email,
  });

  delete data?.fields?.Password;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged in.",
    data: { accessToken, ...data },
  });
});

//   Forget Password
const forgetPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await findUser(email);

  const otp = crypto.randomInt(100000, 999999);
  const hashedOTP = bcrypt.hashSync(String(otp), 10);
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  console.log(user, otp, hashedOTP, otpExpires);

  const options = {
    method: "PATCH",
    url: `${userTable}/${user?.id}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: {
      fields: {
        OTP: hashedOTP,
        OTPExpires: String(otpExpires),
      },
    },
  };

  try {
    await axios.request(options);
  } catch (error) {
    console.log(error?.response?.data);
  }

  // const emailResponse = await sendEmail({
  //   email: user.fields.Email,
  //   subject: "Password Reset",
  //   message: `Your OTP is ${otp}`,
  // });

  // console.log(emailResponse);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent to your email",
    data: {
      email: user.fields.Email,
      otp,
    },
  });
});

// Reset Password
const resetPassword = catchAsync(async (req, res) => {
  const { fields } = req.body;
  const field = "Email";

  try {
    const url = `${userTable}?filterByFormula=({${field}}='${fields.Email}')`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(url, { headers });
    const userRecord = response.data.records[0];

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    // otp section
    const OTP = 12333;

    const Password = fields.Password;
    const hashedPassword = await bcrypt.hash(Password, 10);

    fields.Password = hashedPassword;

    const data = { fields };
    await axios.patch(`${userTable}/${userRecord.id}`, data, { headers });

    return res.status(200).json({ message: "Password reset Successfull" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  createNewUser,
  userLogin,
  forgetPassword,
  resetPassword,
};
