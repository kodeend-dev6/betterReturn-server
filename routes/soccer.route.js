const express = require('express');
const router = express.Router();

const { getAllSoccerMatches, getSingleSoccerMatch, getAllSoccerMatchesByDate } = require('../controllers/soccer.controller');




router.get("/", getAllSoccerMatches);
router.get("/date", getAllSoccerMatchesByDate);
router.get("/:matchID", getSingleSoccerMatch);



module.exports = router;