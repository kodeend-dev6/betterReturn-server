const express = require('express');
const router = express.Router();

const { allNews, getNewsByDate, getSingleNews, createNewNews } = require('../controllers/news.controller');




router.get("/", allNews)
router.get("/date", getNewsByDate);
router.get("/:newsID", getSingleNews);

router.post("/", createNewNews);

module.exports = router;