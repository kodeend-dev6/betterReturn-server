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
const emailRouter = require("./routes/email.route");

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
app.use("/api/email", emailRouter);

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
