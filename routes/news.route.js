const express = require('express');
const router = express.Router();

const { allNews, getNewsByDate, getSingleNews, createNewNews, updateNews, deleteNews } = require('../controllers/news.controller');




router.get("/", allNews)
router.get("/date", getNewsByDate);
router.get("/:newsID", getSingleNews);

router.post("/", createNewNews);
router.put("/:newsID", updateNews);
router.delete("/:newsID", deleteNews);

module.exports = router;