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
const fetcher = require("../utils/fetcher/airTableFetcher");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getAllUser = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const offset = req.query.offset || 0;
  const search = req.query.search || "";

  const result = await fetcher.get(`${userTable}`, {
    params: {
      offset,
      limit,
      count: true,
      sort: [
        {
          field: "Created_at",
          direction: "desc",
        },
      ],
      filterByFormula: `
      OR(
        SEARCH("${search}", LOWER({Name})) > 0,
        SEARCH("${search}", LOWER({Email})) > 0
      )
    `,
    },
  });

  const data = result?.data?.records;

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users Retrieved Successfully",
    data: data,
    meta: {
      total: data?.length,
      totalPages: Math.ceil(data?.length / limit),
      nextOffset: result?.data?.offset,
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

// Insert Old User
const insertOldUser = catchAsync(async (req, res) => {
  // get users from req.body
  const oldUsers = req.body;

  // format users to airtable format

  const users = oldUsers.map((user) => {
    const fields = {
      PrevId: Number(user.id) || "",
      Name: user.name || "",
      Email: user.email || "",
      Mobile: user.mobile || "",
      Country_code: user.country_code || "",
      Country: user.country || "",
      Role: user.role || "",
      Email_verified_at: user.email_verified_at || null,
      Remember_token: user.remember_token || "",
      // Created_at: user.created_at || undefined,
      // Updated_at: user.updated_at || undefined,
      Deleted_at: user.deleted_at || null,
      Free_plan_over_email_sent_at: user.free_plan_over_email_sent_at || null,
      Stripe_id: user.stripe_id || "",
      Pm_type: user.pm_type || "",
      Pm_last_four: user.pm_last_four || "",
      Trial_ends_at: user.trial_ends_at || null,
      Image: user.image || "",
      Gift_code_valid_till: user.gift_code_valid_till || null,
      Is_sms_notifications_enabled:
        user.is_sms_notifications_enabled === "1" ? true : false || true,
      Is_email_notifications_enabled:
        user.is_email_notifications_enabled === "1" ? true : false || true,
      Match_reminder_sms_sent_at: user.match_reminder_sms_sent_at || null,
      Is_staff_member: false,
      Logins_count: Number(user.logins_count) || "",
      Facebook_id: user.facebook_id || "",
      Google_id: user.google_id || "",
      Subscription_id: "",
      FreeTier: false,
      Plan_start_date: null,
      Plan_end_date: null,
      Plan_name: "",
      IsExisting: true,
    };
    return { fields };
  });

  // insert users to airtable
  const airtableURL = `${userTable}`;

  const data = { records: users };

  const response = await fetcher.post(airtableURL, data);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users Inserted Successfully",
    data: response?.data,
  });
});

// Update Old User
const updateOldUser = catchAsync(async (req, res) => {
  const customerId = req.query.customerId;
  const oldUsers = await fetcher.get(`${userTable}`, {
    params: {
      filterByFormula: `{Stripe_id} = '${customerId}'`,
    },
  });

  // Get Subscription Details from Stripe_id which is a customer id of stripe
  const firstUser = oldUsers?.data?.records[0];
  const customer = await stripe.customers.retrieve(customerId, {
    expand: ["subscriptions"],
  });

  // Update to airtable

  if (customer?.subscriptions?.data[0]) {
    const airtableURL = `${userTable}/${firstUser?.id}`;

    const data = {
      fields: {
        Subscription_id: customer?.subscriptions?.data[0]?.id,
        Plan_start_date:
          new Date(
            customer?.subscriptions?.data[0]?.current_period_start * 1000
          ).toISOString() || null,
        Plan_end_date:
          new Date(
            customer?.subscriptions?.data[0]?.current_period_end * 1000
          ).toISOString() || null,
        FreeTier: true,
        Trial_ends_at:
          new Date(
            customer?.subscriptions?.data[0]?.trial_end * 1000
          ).toISOString() || null,
      },
    };

    const response = await fetcher.patch(airtableURL, data);
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users Retrieved Successfully",
    data: oldUsers?.data?.records,
    meta: {
      total: oldUsers?.data?.records?.length,
      customer: customer,
    },
  });
});

// Cancel Old User subscription after current period end
const cancelOldUserSubscription = catchAsync(async (req, res, next) => {
  const priceIdToCancel = "price_1NQ5F1CBxfPNT5xiFDmjHCZ6"; // Replace with the actual price ID
  const priceIdToCancel2 = "price_1NQ5GCCBxfPNT5xilfr2EhUT"; // Replace with the actual price ID

  // Step 1: Retrieve Subscriptions with the Target Price ID
  const retrieveSubscriptions = async () => {
    const subscriptions = await stripe.subscriptions.list({
      price: "price_1OGDvxCBxfPNT5xiYNktRxQE",
      limit: 100, // Adjust based on your needs
    });

    return subscriptions.data;
  };

  // Step 2: Cancel Subscriptions with `cancel_at_period_end` set to true
  const cancelSubscriptions = async (subscriptions) => {
    const cancelPromises = subscriptions.map(async (subscription) => {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
    });

    await Promise.all(cancelPromises);
  };

  // Step 3: Wait for all subscriptions to be cancelled
  // Run the steps
  const result = await retrieveSubscriptions()
    .then((subscriptions) => cancelSubscriptions(subscriptions))
    .then(() => console.log("Subscriptions successfully canceled"))
    .catch((error) => console.error("Error:", error));

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Subscription Operation Successful",
    data: result,
  });
});

module.exports = {
  getAllUser,
  getSingleUser,
  buyPlan,
  updateUserInfo,
  insertOldUser,
  updateOldUser,
  cancelOldUserSubscription,
};
