const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require("axios");
const { isFreetierUsed } = require("../helper/checkFreeTier");
const catchAsync = require("../utils/errors/catchAsync");
const { findUser } = require("../helper/user.helper");
const sendResponse = require("../utils/sendResponse");

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

// Get Single
const getSingleUser = catchAsync(async (req, res) => {
  const { email } = req.user;
  const result = await findUser(email, { throwError: true });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User Retrieved Successfully",
    data: result,
  });
});

const buyPlan = async (req, res) => {
  try {
    const userID = req.params.userID;
    const { fields } = req.body;

    const FreeTierUsed = await isFreetierUsed(fields.Email);

    if (!FreeTierUsed) {
      return res.send("You have already used the free plan. Please Make payment");
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

const updateUserInfo = async (req, res) => {
  const recordId = req.query.id;
  const { fields } = req.body;

  try {
    const airtableURL = `${userTable}/${recordId}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };
    const data = { fields };

    const response = await axios.patch(airtableURL, data, { headers });

    if (response.status === 200) {
      res.status(200).json({ message: "Record updated successfully" });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating the record" });
  }
};


module.exports = {
  getAllUser,
  getSingleUser,
  buyPlan,
  updateUserInfo,
};
