const express = require('express');
const { roiCalculation, soccerPlanRoi } = require('../controllers/roi.controllerV2');
const router = express.Router();


router.get("/", roiCalculation);
router.get("/soccer/plan", soccerPlanRoi);

module.exports = router