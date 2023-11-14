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

const passport = require("passport");
const expressSession = require("express-session");
const passportGoogle = require("./helper/passportGoogle");

const app = express();

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

// Global Error Handler
app.use(globalErrorHandler);

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      // payment_method_types:["card"],
      mode: "payment",
      line_items: req.body.items.map((item) => {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
            },
            unit_amount: item.price * 100,
          },
          quantity: item.quantity,
        };
      }),
      success_url: "https://www.sports.kodeend.com",
      cancel_url: "https://www.br.kodeend.com",
    });
    return res.json({ url: session.url });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
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
