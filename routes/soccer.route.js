const express = require('express');
const router = express.Router();

const { getAllSoccerMatches, getSingleSoccerMatch, getAllSoccerMatchesByDate, createNewMatch, deleteOneMatch, updateOneMatch, getAllFinishedSoccerMatches, getAllNextSoccerMatches } = require('../controllers/soccer.controller');
const { verifyToken } = require('../middleware/token');



// all get route
router.get("/", getAllSoccerMatches);
router.get("/date", verifyToken, getAllSoccerMatchesByDate);
router.get("/previous", getAllFinishedSoccerMatches)
router.get("/next", getAllNextSoccerMatches)
router.get("/:matchID", getSingleSoccerMatch);

// post route
router.post("/", createNewMatch)

// delete route
router.delete("/:recordId", deleteOneMatch)


// update route
router.put("/:recordId", updateOneMatch)



module.exports = router;