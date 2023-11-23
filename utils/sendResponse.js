const sendResponse = (
  res,
  { statusCode, success, stack, message, data, meta }
) => {
  res.status(statusCode).json({
    success: success,
    message: message || undefined,
    meta: meta || undefined,
    stack: stack || undefined,
    data: data || undefined,
  });
};

module.exports = sendResponse;
