const express = require('express');
const router = express.Router();




router.get("/", getAllSoccerMatches);
router.get("/date", getAllSoccerMatchesByDate);
router.get("/:matchID", getSingleSoccerMatch);



module.exports = router;