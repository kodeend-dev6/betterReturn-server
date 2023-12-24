const express = require("express");
const { getAllCombo, getAllComboV2 } = require("../controllers/combo.controller");

const router = express.Router();

router.get("/", getAllCombo);
router.get("/v2", getAllComboV2);

module.exports = router;
