const sendResponse = (res, { statusCode, success, message, data }) => {
  res.status(statusCode).json({
    success: success || undefined,
    message: message || undefined,
    data: data || undefined,
  });
};

module.exports = sendResponse;
