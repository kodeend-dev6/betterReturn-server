const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sendResponse = require("./utils/sendResponse");
const globalErrorHandler = require("./utils/errors/globalErrorHandler");
const morgan = require("morgan");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const soccerRouter = require("./routes/soccer.route");
const csgoRouter = require("./routes/csgo.route");
const valorantRouter = require("./routes/valorant.route");
const newsRouter = require("./routes/news.route");
const authRouter = require("./routes/auth.route");
const userRouter = require("./routes/user.route");
const testRouter = require("./routes/test.route");
const searchRouter = require("./routes/search.route");

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Default Route
app.get("/", (req, res) => {
  res.send("Better Return server is running...");
});

// All Routes
app.use("/api/soccer", soccerRouter);
app.use("/api/csgo", csgoRouter);
app.use("/api/valorant", valorantRouter);
app.use("/api/news", newsRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/test", testRouter);
app.use("/api/search", searchRouter);

// Global Error Handler
app.use(globalErrorHandler);



app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    // const price = req.body.price;
    const price = 30;
    const amount = price*100;
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "EUR",
      amount: amount,
      automatic_payment_methods: { enabled: true },

    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});


// 404 Error handler
app.all("*", (req, res) => {
  sendResponse(res, {
    statusCode: 404,
    success: false,
    message: "Resource not found",
  });
});

module.exports = app;
