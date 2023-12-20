const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require("axios");
const bcrypt = require("bcrypt");
const ApiError = require("../utils/errors/ApiError");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const { getToken } = require("../middleware/token");
const {
  authenticateUser,
  findUser,
  generateOTP,
  verifyOTP,
  incrementLoginCount,
} = require("../helper/user.helper");
const sendNodeEmail = require("../helper/email/sendNodeEmail");
const emailVerificationTemplate = require("../helper/email/emailVerificationTemplate");
const forgotPasswordTemplate = require("../helper/email/forgotPasswordTemplate");
const createUserToKlaviyo = require("../helper/createUserToKlaviyo");

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
  const emailExists = await findUser(Email.toLowerCase(), {
    throwError: false,
  });

  if (emailExists) {
    throw new ApiError(403, "User already exists with this email");
  }

  // await createUserToKlaviyo({
  //   email: Email,
  //   phone: String(Country_code) + Mobile,
  //   // location: response?.data?.fields?.Country,
  // });

  const hashedPassword = bcrypt.hashSync(Password, 10);

  fields.Email = Email.toLowerCase();
  fields.Role = "user";
  fields.Logins_count = 1;
  // fields.Created_at = new Date().toISOString();
  // fields.Updated_at = new Date().toISOString();
  fields.Is_email_notifications_enabled = true;
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
  await sendNodeEmail({
    email: response?.data?.fields?.Email,
    subject: "Email Verification",
    html: emailVerificationTemplate({ otp }),
  });

  const accessToken = getToken({
    id: response.data.id,
    email: response.data.fields.Email,
    role: response.data.fields.Role,
  });

  delete response?.data?.fields?.Password;
  delete response?.data?.fields?.OTP;
  delete response?.data?.fields?.OTPExpires;

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: { accessToken, ...response.data },
  });
});

// User Login
const userLogin = catchAsync(async (req, res) => {
  const { isAuthenticated, data, isExisting } = await authenticateUser(
    req.body
  );

  if (isExisting) {
    return res.status(200).json({
      message:
        "You are an existing user. Please reset your password to continue.",
      isExistingUser: true,
    });
  }

  if (!isAuthenticated) {
    throw new ApiError(401, "Email or Password mismatched!");
  }

  if (!data?.fields?.Email_verified_at && !data?.fields?.Role !== "admin") {
    const { otp, hashedOTP, otpExpires } = generateOTP();
    sendNodeEmail({
      email: data?.fields?.Email,
      subject: "Email Verification",
      html: emailVerificationTemplate({ otp }),
    });

    const options = {
      method: "PATCH",
      url: `${userTable}/${data?.id}`,
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
  }

  // Increment the Logins_count field
  await incrementLoginCount({
    id: data?.id,
    prevLoginCount: data?.fields?.Logins_count,
  });

  const accessToken = getToken({
    id: data?.id,
    email: data?.fields?.Email,
    role: data?.fields?.Role,
  });

  delete data?.fields?.Password;
  delete data?.fields?.OTP;
  delete data?.fields?.OTPExpires;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged in.",
    isExistingUser: false,
    data: { accessToken, ...data },
  });
});

// Verify Email
const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const user = await verifyOTP({ email, otp });

  const options = {
    method: "PATCH",
    url: `${userTable}/${user?.id}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: {
      fields: {
        OTP: "",
        OTPExpires: "",
        Email_verified_at: new Date().toISOString(),
      },
    },
  };

  try {
    const response = await axios.request(options);
    console.log(response);
  } catch (error) {
    console.log(error?.response?.data);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified.",
  });
});

//   Forgot Password
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await findUser(email, { throwError: true });

  const { otp, hashedOTP, otpExpires } = generateOTP();

  sendNodeEmail({
    email: user.fields.Email,
    subject: "Reset Password",
    html: forgotPasswordTemplate({ otp }),
  });

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

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent to your email",
    data: {
      email: user.fields.Email,
    },
  });
});

// Verify Forgot Password OTP
const verifyForgotPasswordOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const user = await verifyOTP({ email, otp });

  const options = {
    method: "PATCH",
    url: `${userTable}/${user?.id}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: {
      fields: {
        OTP: "",
        OTPExpires: "",
        Email_verified_at: user?.fields?.Email_verified_at
          ? ""
          : new Date().toISOString(),
        IsExisting: false,
      },
    },
  };

  try {
    const response = await axios.request(options);
    console.log(response);
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
  const user = await findUser(email, { throwError: true });

  const hashedPassword = bcrypt.hashSync(password, 10);

  const options = {
    method: "PATCH",
    url: `${userTable}/${user?.id}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: {
      fields: {
        Password: hashedPassword,
      },
    },
  };

  await axios.request(options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password updated.",
  });
});

// Google Login
const googleLoginCallback = catchAsync(async (req, res) => {
  const info = {
    Name: req.user._json.name,
    Email: req.user._json.email.toLowerCase(),
    Google_id: req.user._json.sub,
    Image: req.user._json.picture,
    Country: req.user._json.country,
  };

  const user = await findUser(info?.Email, { throwError: false });

  // If user doesn't exist, create a new user with google info
  if (!user) {
    const { otp, hashedOTP, otpExpires } = generateOTP();

    info.Role = "user";
    info.Logins_count = 1;
    // info.Created_at = new Date().toISOString();
    // info.Updated_at = new Date().toISOString();
    info.OTP = hashedOTP;
    info.OTPExpires = String(otpExpires);
    const data = { fields: info };

    const response = await axios.post(userTable, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    await sendNodeEmail({
      email: response?.data?.fields?.Email,
      subject: "Email Verification",
      html: emailVerificationTemplate({ otp }),
    });

    const accessToken = getToken({
      id: response?.data?.id,
      email: response?.data?.fields?.Email,
    });

    delete response?.data?.fields?.Password;
    delete response?.data?.fields?.OTP;
    delete response?.data?.fields?.OTPExpires;

    const redirectURL = `${process.env.USER_SITE_URL}/google-callback?token=${accessToken}`;
    console.log(redirectURL);
    res.redirect(redirectURL);
  }

  // If user exists, update the info
  const accessToken = getToken({
    id: user?.id,
    email: user?.fields?.Email,
    role: user?.fields?.Role,
  });

  // update the user info if google_id not found
  if (!user?.fields?.Google_id) {
    const options = {
      method: "PATCH",
      url: `${userTable}/${user?.id}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      data: {
        fields: {
          Google_id: info?.Google_id,
          Image: info?.Image,
          Logins_count: user?.fields?.Logins_count + 1,
        },
      },
    };

    try {
      await axios.request(options);
    } catch (error) {
      console.log(error?.response?.data);
    }
  } else {
    await incrementLoginCount({
      id: user?.id,
      prevLoginCount: user?.fields?.Logins_count,
    });
  }

  const redirectURL = `${process.env.USER_SITE_URL}/google-callback?token=${accessToken}`;
  console.log(redirectURL);
  res.redirect(redirectURL);
});

module.exports = {
  createNewUser,
  userLogin,
  verifyEmail,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  googleLoginCallback,
};
