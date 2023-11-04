const express = require('express');
const router = express.Router();

const { getAllSoccerMatches, getSingleSoccerMatch, getAllSoccerMatchesByDate, createNewMatch } = require('../controllers/soccer.controller');



// all get route
router.get("/", getAllSoccerMatches);
router.get("/date", getAllSoccerMatchesByDate);
router.get("/:matchID", getSingleSoccerMatch);

// post route

router.post("/", createNewMatch)



module.exports = router;