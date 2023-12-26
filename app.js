const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sendResponse = require("./utils/sendResponse");
const globalErrorHandler = require("./utils/errors/globalErrorHandler");
const morgan = require("morgan");

const soccerRouter = require("./routes/soccer.route");
const csgoRouter = require("./routes/csgo.route");
const valorantRouter = require("./routes/valorant.route");
const newsRouter = require("./routes/news.route");
const authRouter = require("./routes/auth.route");
const userRouter = require("./routes/user.route");
const testRouter = require("./routes/test.route");
const searchRouter = require("./routes/search.route");
const paymentRouter = require("./routes/payment.route");
const PickOfTheDayRouter = require("./routes/pickOfDay.route");
const reviewRouter = require("./routes/review.route");
const comboRouter = require("./routes/combo.route");
const handicapRouter = require("./routes/handicap.route");
const roiRouter = require('./routes/roi.route');
const accuracyRouter = require('./routes/accuracy.route');
const adminRouter = require("./routes/admin.route");

const passport = require("passport");
const expressSession = require("express-session");
const passportGoogle = require("./helper/passportGoogle");
const stripeWebhook = require("./utils/stripe/stripeWebhook");

const app = express();

// Stripe Webhook
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// Initialize session and passport
app.use(
  expressSession({
    secret: process.env.TOKEN_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passportGoogle();

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
app.use("/api/payment", paymentRouter);
app.use("/api/pick-of-the-day", PickOfTheDayRouter);
app.use("/api/review", reviewRouter);
app.use("/api/combo", comboRouter);
app.use("/api/handicap", handicapRouter);
app.use("/api/roi", roiRouter);
app.use('/api/accuracy', accuracyRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use(globalErrorHandler);

// 404 Error handler
app.all("*", (req, res) => {
  sendResponse(res, {
    statusCode: 404,
    success: false,
    message: "Resource not found",
  });
});

module.exports = app;
