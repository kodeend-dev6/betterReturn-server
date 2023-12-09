const express = require('express');
const { getAllHandicap } = require('../controllers/handicap.controller');
const router = express.Router();


router.get("/", getAllHandicap)

module.exports = router