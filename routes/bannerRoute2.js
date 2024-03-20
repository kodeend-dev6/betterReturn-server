const express = require('express');
const { getBannerData2 } = require('../controllers/bannerController');
const router = express.Router();


router.get("/", getBannerData2);


module.exports = router;