const express = require('express');
const router = express.Router();

const { createNewUser, getAllUser, userLogin, buyPlan, resetPassword, forgetPassword } = require('../controllers/user.controler');

router.get("/", getAllUser);
router.post('/registration', createNewUser);
router.post('/login', userLogin);



router.put("/plan/:userID", buyPlan);
router.post("/reset-password", resetPassword);
router.post("/forget-password", forgetPassword);

module.exports = router;