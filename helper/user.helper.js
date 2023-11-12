const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require("axios");
const bcrypt = require("bcrypt");
const ApiError = require("../utils/errors/ApiError");
const crypto = require("crypto");

const authenticateUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  try {
    // Fetch user data from Airtable based on the provided username
    const response = await axios.get(userTable, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        filterByFormula: `Email = "${email}"`,
      },
    });

    const user = response.data.records[0];

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    // Compare the hashed password
    if (await bcrypt.compare(password, user.fields.Password)) {
      return { isAuthenticated: true, data: user };
    } else {
      return { isAuthenticated: false, data: null };
    }
  } catch (error) {
    throw new ApiError(500, "Internal server error.");
  }
};

const findUser = async (email) => {
  try {
    const response = await axios.get(userTable, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        filterByFormula: `Email = "${email}"`,
      },
    });

    const user = response?.data?.records[0];

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return user;
  } catch (error) {
    throw new ApiError(500, "Internal server error.");
  }
};

const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999);
  const hashedOTP = bcrypt.hashSync(String(otp), 10);
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return {
    otp,
    hashedOTP,
    otpExpires,
  };
};

module.exports = {
  authenticateUser,
  findUser,
  generateOTP,
};
