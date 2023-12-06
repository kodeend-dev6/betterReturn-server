const createSubscriptionToDB = require("../../helper/subscription/createSubscriptionToDB");
const updateSubscription = require("../../helper/subscription/updateSubscription");
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
    const subscription = event.data.object;
    if (
      subscription.status === "active" &&
      subscription.trial_end &&
      Date.now() > subscription.trial_end + 1 * 24 * 60 * 60 * 1000
    ) {
      try {
        const invoice = await stripe.invoices.create({
          customer: subscription.customer,
          auto_advance: true, // Automatically pay the invoice
        });

        await updateSubscription({ subscription, invoice });

        if (invoice && invoice.status === 'open') {
          const paymentIntent = await stripe.paymentIntents.confirm(invoice.payment_intent);
          if (paymentIntent.status === 'requires_action') {
            sendResponse(response, {
              statusCode: 200,
              success: true,
              message: "Additional authentication required",
              data: { clientSecret: paymentIntent.client_secret }
            });
            return;
          }
        }

        // Handle successful payment and update your database accordingly
        // For example, update user status or send confirmation email
      } catch (error) {
        console.error('Error handling subscription after trial:', error);
        response.status(500).send('Error handling subscription after trial');
        return;
      }
    }
  } else {
    console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  sendResponse(response, {
    statusCode: 200,
    success: true,
    message: "Webhook received",
    data,
  });
});

module.exports = stripeWebhook;
