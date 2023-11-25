const { AxiosError } = require("axios");
const sendResponse = require("../sendResponse");
const ApiError = require("./ApiError");

// Global Error Handler
const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err?.statusCode || 500;
  let message = err?.message || "Something went wrong!";

  console.log(err)

  if (err instanceof AxiosError) {
    message = "Internal Server Error";
    statusCode = err?.response?.status || 500;
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    message = err.message;
  }

  sendResponse(res, {
    statusCode,
    success: false,
    message,
    stack: err?.stack,
  });
};

module.exports = globalErrorHandler;
