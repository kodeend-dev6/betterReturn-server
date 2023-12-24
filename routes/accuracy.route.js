const express = require('express');
const { getAccuracy } = require('../controllers/accuracy.controller');
const router = express.Router();


router.get("/", getAccuracy);

module.exports = router