const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/token");

const {
  getAllUser,
  buyPlan,
  updateUserInfo,
  getSingleUser,
} = require("../controllers/user.controller");
const upload = require("../utils/upload");

router.get("/", getAllUser);
router.get("/get", verifyToken, getSingleUser);
router.put("/update", upload.single("Image"), updateUserInfo);
router.put("/plan/:userID", buyPlan);

module.exports = router;
