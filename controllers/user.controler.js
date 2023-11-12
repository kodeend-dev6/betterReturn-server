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
const { getToken } = require("../middleware/token");

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

    if (!FreeTierUsed) {
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

    if (fields.Plan_name === "Basic") {
      data.fields["FreeTier"] = true;
      data.fields["Plan_end_date"] = new Date(freeEndDate).toISOString();
    } else {
      data.fields["Plan_end_date"] = new Date(freeEndDate).toISOString();
    }


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

// Endpoint to initiate the password reset process
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
      return res.status(404).json({ error: 'User not found' });
    }

    // otp section
    const OTP = 12333;

    const Password = fields.Password;
    const hashedPassword = await bcrypt.hash(Password, 10);

    fields.Password = hashedPassword;

    const data = { fields };
    await axios.patch(`${userTable}/${userRecord.id}`, data, { headers });

    return res.status(200).json({ message: 'Password reset Successfull' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const forgetPassword = async (req, res) => {
  try {

    const { Email } = req.body;

    const Response = await axios.get(userTable, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        filterByFormula: `{Email} = '${Email}'`,
      },
    });



    if (Response.data.records.length > 0) {
      
      // we have to send email for reset password

      res.status(200).json({ message: 'Check your email to reset password' });
    } else {
      res.status(404).json({ message: 'Email not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}


module.exports = { createNewUser, getAllUser, userLogin, buyPlan, resetPassword, forgetPassword };
