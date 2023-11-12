const express = require("express");
const router = express.Router();

const { getAllUser, buyPlan } = require("../controllers/user.controller");

router.get("/", getAllUser);
router.put("/plan/:userID", buyPlan);

module.exports = router;
