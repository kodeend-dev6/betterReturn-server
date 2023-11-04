const express = require('express');
const router = express.Router();
const { getAllValorantMatches, getAllValorantMatchesByDate, getSingleValorantMatch } = require('../controllers/valorant.controller');



router.get("/", getAllValorantMatches);
router.get("/date", getAllValorantMatchesByDate);
router.get("/:matchID", getSingleValorantMatch);



module.exports = router;