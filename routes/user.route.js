const express = require('express');
const router = express.Router();

const { createNewUser, getAllUser, userLogin } = require('../controllers/user.controler');


router.post('/registration', createNewUser);
router.post('/login', userLogin);
router.get("/", getAllUser);


module.exports = router;