const createSubscriptionToDB = require("../../helper/subscription/createSubscriptionToDB");
const deletedSubscriptionToDB = require("../../helper/subscription/deleteSubscriptionToDB");
const paymentSuccessToDB = require("../../helper/subscription/paymentSuccessToDB");
const {
  updatePaymentRequired,
} = require("../../helper/subscription/udpatePaymentRequired");
const updateSubscriptionToDB = require("../../helper/subscription/updateSubscriptionToDB");
const catchAsync = require("../errors/catchAsync");
const sendResponse = require("../sendResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const stripeWebhook = catchAsync(async (request, response) => {
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    "whsec_fa707738d0c6086beb392b253a5d0952317bdff7ded150739a55e6a788740929";

  const sig = request.headers["stripe-signature"];

  let event;
  let data;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  if (event?.type === "customer.subscription.created") {
    const subscription = await stripe.subscriptions.retrieve(
      event.data.object.id,
      { expand: ["customer"] }
    );
    await createSubscriptionToDB(subscription);
  } else if (event?.type === "customer.subscription.updated") {
    const subscription = await stripe.subscriptions.retrieve(
      event.data.object.id,
      { expand: ["customer"] }
    );
    await updateSubscriptionToDB(subscription);
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = await stripe.subscriptions.retrieve(
      event.data.object.id,
      { expand: ["customer"] }
    );
    await deletedSubscriptionToDB(subscription);
  } else if (event?.type === "invoice.payment_action_required") {
    const invoice = event.data.object;

    await updatePaymentRequired(invoice);
  } else if (event?.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;

    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription
    );

    await paymentSuccessToDB({
      subscription,
      customer_email: invoice.customer_email,
    });
  } else {
    console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  sendResponse(response, {
    statusCode: 200,
    success: true,
    message: `Webhook received for ${event?.type}`,
    data,
  });
});

module.exports = stripeWebhook;
