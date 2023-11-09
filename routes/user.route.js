const express = require('express');
const router = express.Router();

const { createNewUser, getAllUser, userLogin, buyPlan } = require('../controllers/user.controler');

router.get("/", getAllUser);
router.post('/registration', createNewUser);
router.post('/login', userLogin);



router.put("/plan/:userID", buyPlan)

module.exports = router;