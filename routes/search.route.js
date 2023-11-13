const express = require('express');
const { searchGame } = require('../controllers/search.controller');
const router = express.Router();


router.get("/game", searchGame);


module.exports = router;