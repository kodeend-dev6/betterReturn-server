const express = require("express");
const router = express.Router();

const { getAllUser, buyPlan, updateUserInfo } = require("../controllers/user.controller");

router.get("/", getAllUser);
router.put("/update", updateUserInfo)
router.put("/plan/:userID", buyPlan);

module.exports = router;
