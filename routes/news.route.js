const express = require('express');
const router = express.Router();

const { allNews } = require('../controllers/news.controller');




router.get("/", allNews)

module.exports = router;