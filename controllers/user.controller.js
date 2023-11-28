const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require("axios");
const { isFreetierUsed } = require("../helper/checkFreeTier");
const catchAsync = require("../utils/errors/catchAsync");
const { findUser } = require("../helper/user.helper");
const sendResponse = require("../utils/sendResponse");
const cloudinaryUpload = require("../utils/cloudinary");
const fs = require("fs");
const ApiError = require("../utils/errors/ApiError");
const path = require("path");

const Airtable = require("airtable");
const base = new Airtable({
  apiKey: config.key.apiKey,
}).base(process.env.AIRTABLE_TEST_BASEID);

const getAllUser = catchAsync(async (req, res) => {
  // const page = Number(req.query.page) || 1;
  // const limit = Number(req.query.limit) || 5;

  const result = await base("User")
    .select({
      // pageSize: limit, maxRecords: limit, offset: (page - 1)
    })
    .all();

  const data = result?.map((record) => record?._rawJson);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users Retrieved Successfully",
    data: data,
    meta: {
      total: data?.length,
    },
  });
});

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
    const userID = req.query.userID;
    const { fields } = req.body;

    const FreeTierUsed = await isFreetierUsed(fields.Email);

    if (!FreeTierUsed) {
      return res.json({
        message: "You have already Used the Free Plan. Please pay Now.",
      });
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

const updateUserInfo = catchAsync(async (req, res) => {
  const recordId = req.query.id;
  const input = req.body;
  const file = req?.file?.filename;

  if (file) {
    const filePath = `./images/${file}`;
    const fileName = path.parse(file).name;

    const { url } = await cloudinaryUpload(fileName, filePath);
    input.Image = url;

    // Deleting local file
    fs.unlinkSync(filePath);
  }

  // Update to airtable
  const airtableURL = `${userTable}/${recordId}`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  const data = { fields: input };

  const response = await axios.patch(airtableURL, data, { headers });

  if (response.status === 200) {
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User Updated Successfully",
      data: response?.data,
    });
  } else {
    throw new ApiError(
      response?.status || 500,
      response?.data?.error?.message || "Internal Server Error"
    );
  }
});

// const insertOldUser = catchAsync(async (req, res, next) => {
//   // get users from req.body
//   const oldUsers = req.body;

//   // format users to airtable format

//   const users = oldUsers.map((user) => {
//     const fields = {
//       Id: user.id || "",
//       Name: user.name || "",
//       Email: user.email || "",
//       Mobile: user.mobile || "",
//       Country_code: user.country_code || "",
//       Country: user.country || "",
//       Role: user.role || "",
//       Email_verified_at: user.email_verified_at || "",
//       Remember_token: user.remember_token || "",
//       Created_at: user.created_at || "",
//       Updated_at: user.updated_at || "",
//       Deleted_at: user.deleted_at || "",
//       Free_plan_over_email_sent_at: user.free_plan_over_email_sent_at || "",
//       Stripe_id: user.stripe_id || "",
//       Pm_type: user.pm_type || "",
//       Pm_last_four: user.pm_last_four || "",
//       Trial_ends_at: user.trial_ends_at || "",
//       Image: user.image || "",
//       Gift_code_valid_till: user.gift_code_valid_till || "",
//       Is_sms_notifications_enabled:
//         user.is_sms_notifications_enabled === "1" ? true : false || "",
//       Is_email_notifications_enabled:
//         user.is_email_notifications_enabled === "1" ? true : false || "",
//       Match_reminder_sms_sent_at: user.match_reminder_sms_sent_at || "",
//       Is_staff_member: false,
//       Logins_count: Number(user.logins_count) || "",
//       Facebook_id: user.facebook_id || "",
//       Google_id: user.google_id || "",
//       Subscription_id: "",
//       FreeTier: false,
//       Plan_start_date: "",
//       Plan_end_date: "",
//       Plan_name: "",
//       IsExisting: true,
//     };
//     return { fields };
//   });

//   // insert users to airtable
//   const airtableURL = `${userTable}`;

//   const data = { records: users };

//   const response = await fetcher.post(airtableURL, data);

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Users Inserted Successfully",
//     data: response?.data,
//   });
// });

// const updateOldUser = catchAsync(async (req, res, next) => {
//   const customerId = req.query.customerId;
//   const oldUsers = await fetcher.get(`${userTable}`, {
//     params: {
//       filterByFormula: `{Stripe_id} = '${customerId}'`,
//     },
//   });

//   // Get Subscription Details from Stripe_id which is a customer id of stripe
//   const firstUser = oldUsers?.data?.records[0];
//   const customer = await stripe.customers.retrieve(customerId, {
//     expand: ["subscriptions"],
//   });

//   // Update to airtable

//   if (customer?.subscriptions?.data[0]) {
//     const airtableURL = `${userTable}/${firstUser?.id}`;

//     const data = {
//       fields: {
//         Subscription_id: customer?.subscriptions?.data[0]?.id,
//         Plan_start_date: new Date(
//           customer?.subscriptions?.data[0]?.current_period_start * 1000
//         ).toISOString(),
//         Plan_end_date: new Date(
//           customer?.subscriptions?.data[0]?.current_period_end * 1000
//         ).toISOString(),
//         FreeTier: true,
//         Trial_ends_at:
//           new Date(
//             customer?.subscriptions?.data[0]?.trial_end * 1000
//           ).toISOString() || "",
//       },
//     };

//     const response = await fetcher.patch(airtableURL, data);
//   }

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Users Retrieved Successfully",
//     data: oldUsers?.data?.records,
//     meta: {
//       total: oldUsers?.data?.records?.length,
//       customer: customer,
//     },
//   });
// });

module.exports = {
  getAllUser,
  getSingleUser,
  buyPlan,
  updateUserInfo,
  // insertOldUser,
  // updateOldUser,
};
