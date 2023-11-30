const createSubscriptionToDB = require("../../helper/subscription/createSubscriptionToDB");
const catchAsync = require("../errors/catchAsync");
const sendResponse = require("../sendResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const stripeWebhook = catchAsync(async (request, response) => {
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    "whsec_fa707738d0c6086beb392b253a5d0952317bdff7ded150739a55e6a788740929";

  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "subscription_schedule.created":
      const subscriptionScheduleCreated = event.data.object;
      break;
    case "customer.subscription.created":
      const subscription = await stripe.subscriptions.retrieve(
        event.data.object.id,
        { expand: ["customer"] }
      );
      await createSubscriptionToDB(subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  sendResponse(response, {
    statusCode: 200,
    success: true,
    message: "Webhook received",
  });
});

module.exports = stripeWebhook;
