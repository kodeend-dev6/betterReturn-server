const express = require('express');
const router = express.Router();

const { getAllSoccerMatches, getSingleSoccerMatch, getAllSoccerMatchesByDate, createNewMatch, deleteOneMatch, updateOneMatch, getAllFinishedSoccerMatches } = require('../controllers/soccer.controller');



// all get route
router.get("/", getAllSoccerMatches);
router.get("/date", getAllSoccerMatchesByDate);
router.get("/previous", getAllFinishedSoccerMatches)
router.get("/:matchID", getSingleSoccerMatch);

// post route
router.post("/", createNewMatch)

// delete route
router.delete("/:recordId", deleteOneMatch)


// update route
router.put("/:recordId", updateOneMatch)



module.exports = router;