const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { findUser } = require("../helper/user.helper");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const createSubscriptionToDB = require("../helper/subscription/createSubscriptionToDB");

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
const createSubscription = catchAsync(async (req, res, next) => {
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

  const user = findUser(email, { throwError: true });

  console.log(user);

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
const cancelSubscription = catchAsync(async (req, res, next) => {
  const { subscriptionId } = req.body;

  const deletedSubscription = await stripe.subscriptions.cancel(subscriptionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: { deletedSubscription },
  });
});

// Stripe Webhook
const stripeWebhook = catchAsync(async (req, res, next) => {
  const webhookSecret = "whsec_w0KoUWOPhgDDIw8HZCYGyewapM3adr1Z";
  const sig = req.headers[webhookSecret];

  let event;

  try {
    event = await stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "subscription_schedule.aborted":
      const subscriptionScheduleAborted = event.data.object;
      // Then define and call a function to handle the event subscription_schedule.aborted
      break;
    case "subscription_schedule.canceled":
      const subscriptionScheduleCanceled = event.data.object;
      // Then define and call a function to handle the event subscription_schedule.canceled
      break;
    case "subscription_schedule.completed":
      const subscriptionScheduleCompleted = event.data.object;
      // Then define and call a function to handle the event subscription_schedule.completed
      break;
    case "subscription_schedule.created":
      const subscriptionScheduleCreated = event.data.object;
      await createSubscriptionToDB(subscriptionScheduleCreated);
      break;
    case "subscription_schedule.expiring":
      const subscriptionScheduleExpiring = event.data.object;
      // Then define and call a function to handle the event subscription_schedule.expiring
      break;
    case "subscription_schedule.released":
      const subscriptionScheduleReleased = event.data.object;
      // Then define and call a function to handle the event subscription_schedule.released
      break;
    case "subscription_schedule.updated":
      const subscriptionScheduleUpdated = event.data.object;
      // Then define and call a function to handle the event subscription_schedule.updated
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

module.exports = {
  paymentCheckout,
  createSubscription,
  cancelSubscription,
  stripeWebhook,
};
