const express = require('express');
const router = express.Router();

const { getAllCsgoMatches, getAllCsgoMatchesByDate, getSingleCsgoMatch, createNewCsgoMatch, updateOneCsgoMatch, deleteOneCsgoMatch, getAllFinishedCsgoMatches } = require('../controllers/csgo.controller');




router.get("/", getAllCsgoMatches);
router.get("/date", getAllCsgoMatchesByDate);
router.get("/previous", getAllFinishedCsgoMatches);
router.get("/:matchID", getSingleCsgoMatch);


router.post("/", createNewCsgoMatch);
router.put("/:recordId", updateOneCsgoMatch);
router.delete("/:recordId", deleteOneCsgoMatch)



module.exports = router;