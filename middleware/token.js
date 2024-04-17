const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const ApiError = require("../utils/errors/ApiError");
const catchAsync = require("../utils/errors/catchAsync");

// Generate a token
exports.getToken = (data, expire) => {
  return jwt.sign(data, process.env.TOKEN_SECRET, {
    expiresIn: expire || "7d",
  });
};

// Verify A Token
exports.verifyToken =catchAsync(async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Unauthorized Access ..!");
    }
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.TOKEN_SECRET
    );
    req.user = decoded;
    // console.log(req.user);
    next();
  } catch (error) {
    throw new ApiError(403, "Forbidden Access ..!");
  }
})
