const express = require('express');
const router = express.Router();

const { getAllCsgoMatches, getAllCsgoMatchesByDate, getSingleCsgoMatch } = require('../controllers/csgo.controller');




router.get("/", getAllCsgoMatches);
router.get("/date", getAllCsgoMatchesByDate);
router.get("/:matchID", getSingleCsgoMatch);



module.exports = router;