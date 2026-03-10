const express = require('express');
const router = express.Router();
const { processNfcScan } = require('../controllers/scanController');

// CA1 : La route POST / (qui deviendra /api/scan grâce à server.js)
router.post('/', processNfcScan);

module.exports = router;