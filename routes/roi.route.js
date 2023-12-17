const express = require('express');
const { getRoi } = require('../controllers/roi.controller');
const router = express.Router();


router.get('/', getRoi);

module.exports = router