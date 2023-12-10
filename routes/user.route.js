const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/token");

const {
  getAllUser,
  buyPlan,
  updateUserInfo,
  getSingleUser,
  insertOldUser,
  updateOldUser,
  cancelOldUserSubscription,
} = require("../controllers/user.controller");
const upload = require("../utils/upload");

router.get("/", getAllUser);
router.get("/get", verifyToken, getSingleUser);
router.put("/update", upload.single("Image"), updateUserInfo);
router.put("/plan/:userID", buyPlan);

// insert old user
router.post("/insert-old", insertOldUser);
router.post("/update-old", updateOldUser);
router.post("/cancel-old-subscription", cancelOldUserSubscription)

module.exports = router;
