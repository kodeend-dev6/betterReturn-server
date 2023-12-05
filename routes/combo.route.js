const express = require("express");
const { getAllCombo } = require("../controllers/combo.controller");

const router = express.Router();

router.get("/", getAllCombo);

module.exports = router;
