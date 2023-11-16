const express = require('express');
const { getPickOfDay } = require('../controllers/picOfDay.controller');
const router = express.Router();


router.get("/", getPickOfDay);


module.exports = router;