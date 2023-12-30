const express = require("express");
const { getRoi, getSoccerRoi } = require("../controllers/roi.controller");
const router = express.Router();

router.get("/", getRoi);
router.get("/soccer", getSoccerRoi);

module.exports = router;
