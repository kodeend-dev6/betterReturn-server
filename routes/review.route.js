const express = require('express');
const router = express.Router();
const { createReview, getAllReview } = require('../controllers/review.controller');

router.post("/", createReview);
router.get("/", getAllReview);

module.exports = router;