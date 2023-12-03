/* eslint-disable no-undef */
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { findUser } = require("../helper/user.helper");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const config = require("../config/config");
const fetcher = require("../utils/fetcher/airTableFetcher");
const userTable = config.db.userTableUrl;

// Get All Subscription Plans
const getSubscriptionPlans = catchAsync(async (req, res) => {
  const result = await fetcher.get(config.db.planTableUrl, {
    params: {
      sort: [
        { field: "name", direction: "asc" },
        { field: "price", direction: "asc" },
      ],
    },
  });

  const data = result?.data?.records;

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Plans retrieved successfully",
    data,
    meta: {
      total: data?.length,
    },
  });
});

const paymentCheckout = catchAsync(async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: req.body.items.map((item) => {
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      };
    }),
    success_url: `${process.env.CLIENT_SITE_URL}/payment?success=true&plan=${req.body.items[0].name}`,
    cancel_url: `${process.env.CLIENT_SITE_URL}/payment?success=false`,
  });

  console.log(session);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: { url: session.url },
  });
});

// Create a new subscription
const createSubscription = catchAsync(async (req, res) => {
  const { name, email, planId, paymentMethod } = req.body;

  let customer;
  // Check if customer already exists in Stripe
  let customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  customer = customers?.data[0];

  // Create new customer in Stripe
  if (!customer) {
    customer = await stripe.customers.create({
      name,
      email,
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });
  }

  const user = await findUser(email, { throwError: true });

  // if there is existing subscription, cancel it
  if (user?.fields?.Subscription_id) {
    await stripe.subscriptions.cancel(user?.fields?.Subscription_id);
  }

  // Create new subscription for customer
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: planId }],
    trial_period_days: user?.fields?.FreeTier ? undefined : 7,
    payment_settings: {
      payment_method_types: ["card"],
      save_default_payment_method: "on_subscription",
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
    },
    expand: ["latest_invoice.payment_intent"],
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: {
      customer,
      subscription,
      clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret,
      status: subscription?.status,
    },
  });
});

// Cancel a subscription
const cancelSubscription = catchAsync(async (req, res) => {
  const { subscriptionId, email } = req.body;

  const deletedSubscription = await stripe.subscriptions.cancel(subscriptionId);

  // Update to airtable
  const user = await findUser(email, { throwError: true });
  const airtableURL = `${userTable}/${user?.id}`;
  const data = {
    fields: {
      Subscription_id: "",
      Plan_name: "",
      Plan_start_date: "",
      Plan_end_date: "",
      Trial_ends_at: "",
    },
  };

  await fetcher.patch(airtableURL, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription canceled successfully",
    data: { deletedSubscription },
  });
});

module.exports = {
  getSubscriptionPlans,
  paymentCheckout,
  createSubscription,
  cancelSubscription,
};
