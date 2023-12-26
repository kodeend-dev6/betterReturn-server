const express = require('express');
const { getDashboardData } = require('../controllers/admin.controller');
const router = express.Router();



router.get('/dashboard', getDashboardData)

module.exports = router;