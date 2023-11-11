const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require("axios");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const emailCheck = require("../helper/emailCheck");
const sendEmail = require("../helper/sendEmail");
const { isFreetierUsed } = require("../helper/checkFreeTier");
const ApiError = require("../utils/errors/ApiError");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");

const createNewUser = async (req, res) => {
  const { fields } = req.body;

  const { Email, Name, Password, Country_code, Country, Mobile } = fields;

  if (!Email || !Name || !Password || !Country_code || !Country || !Mobile) {
    return res.status(400).json({
      success: false,
      message: "Missing email, name, password, country, country_code or mobile",
    });
  }

  const hashedPassword = await bcrypt.hash(Password, 10);

  fields.Password = hashedPassword;

  try {
    // Check if the email already exists
    const emailExists = await emailCheck.isUserEmailExists(Email);

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
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

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: response.data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Middleware to check if a user is authenticated
const authenticateUser = async ({ email, password }) => {
  if (!email || !password) {
    return res
      .status(401)
      .json({ success: false, message: "Email and password are required." });
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
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }

    // Compare the hashed password
    if (await bcrypt.compare(password, user.fields.Password)) {
      return { isAuthenticated: true, data: user };
    } else {
      return { isAuthenticated: false, data: null };
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Login endpoint
const userLogin = catchAsync(async (req, res, next) => {
  const { isAuthenticated, data } = await authenticateUser(req.body);

  if (!isAuthenticated) {
    throw new ApiError(401, "Email or Password mismatched!");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged in.",
    data,
  });
});

const getAllUser = async (req, res) => {
  try {
    const response = await axios.get(userTable, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const data = await response.data.records;
    res.status(200).json(data);
  } catch (error) {
    console.error("Cant't fetch user from airtable.", error);
    res.status(500).json({ message: "Can't fetch all user." });
  }
};

const buyPlan = async (req, res) => {
  try {
    const userID = req.params.userID;
    const { fields } = req.body;

    const FreeTierUsed = await isFreetierUsed(fields.Email);

    if (!FreeTierUsed && fields.Plan_name === "A") {
      return res.send("You have already used the free plan.");
    }

    const airtableURL = `${userTable}/${userID}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const today = new Date();
    const nextWeek = new Date(today);
    const freeEndDate = nextWeek.setDate(today.getDate() + 7);

    const data = { fields };

    data.fields["Plan_start_date"] = today.toISOString();

    if (fields.Plan_name === "A") {
      data.fields["FreeTier"] = true;
      data.fields["Plan_end_date"] = new Date(freeEndDate).toISOString();
    } else {
      data.fields["Plan_end_date"] = new Date(freeEndDate).toISOString();
    }

    console.log(data);

    const response = await axios.patch(airtableURL, data, { headers });

    if (response.status === 200) {
      res.status(200).json({ message: "Your plan is activated." });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error("Buy plan error");
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNewUser, getAllUser, userLogin, buyPlan };
