const sendResponse = (res, { statusCode, success, stack, message, data }) => {
  res.status(statusCode).json({
    success: success,
    message: message || undefined,
    stack: stack || undefined,
    data: data || undefined,
  });
};

module.exports = sendResponse;
