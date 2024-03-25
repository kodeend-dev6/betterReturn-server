const express = require('express');
const { roiCalculation } = require('../controllers/roi.controllerV2');
const router = express.Router();


router.get("/", roiCalculation);

module.exports = router