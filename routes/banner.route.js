const express = require("express");
const { getBannerData } = require("../controllers/banner.controller");
const router = express.Router();

router.get("/", getBannerData);

module.exports = router;
