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
const {
  authenticateUser,
  findUser,
  generateOTP,
} = require("../helper/user.helper");

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

  // Check if the email already exists
  const emailExists = await emailCheck.isUserEmailExists(Email);

  if (emailExists) {
    throw new ApiError(403, "User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(Password, 10);
  fields.Password = hashedPassword;
  const { otp, hashedOTP, otpExpires } = generateOTP();
  fields.OTP = hashedOTP;
  fields.OTPExpires = String(otpExpires);
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

//   Forgot Password
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await findUser(email);

  const { otp, hashedOTP, otpExpires } = generateOTP();

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

// Verify OTP
const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const user = await findUser(email);

  if (!user?.fields?.OTP) throw new ApiError(400, "OTP not found.");

  const isMatched = bcrypt.compareSync(String(otp), user?.fields?.OTP);

  if (!isMatched) {
    throw new ApiError(401, "OTP mismatched.");
  }

  if (user?.fields?.OTPExpires < Date.now()) {
    throw new ApiError(411, "OTP expired.");
  }

  const options = {
    method: "PATCH",
    url: `${userTable}/${user?.id}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: { fields: { OTP: "", OTPExpires: "" } },
  };

  try {
    await axios.request(options);
  } catch (error) {
    console.log(error?.response?.data);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified.",
  });
});

// Reset Password
const resetPassword = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await findUser(email);

  const hashedPassword = await bcrypt.hash(password, 10);
  fields.Password = hashedPassword;
  const data = { fields };

  await axios.patch(`${userTable}/${user.id}`, data, { headers });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password updated.",
  });
});

module.exports = {
  createNewUser,
  userLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
