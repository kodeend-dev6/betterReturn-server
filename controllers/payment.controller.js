const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");

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

module.exports = {
  paymentCheckout,
};
