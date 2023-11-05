const express = require('express');
const router = express.Router();
const { getAllValorantMatches, getAllValorantMatchesByDate, getSingleValorantMatch, createNewValorantMatch, updateOneValorantMatch, deleteOneValorantMatch } = require('../controllers/valorant.controller');



router.get("/", getAllValorantMatches);
router.get("/date", getAllValorantMatchesByDate);
router.get("/:matchID", getSingleValorantMatch);

router.post("/", createNewValorantMatch)
router.put("/:recordId", updateOneValorantMatch)
router.delete("/:recordId", deleteOneValorantMatch)


module.exports = router;