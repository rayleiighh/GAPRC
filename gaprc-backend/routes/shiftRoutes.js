const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

// CA1 : Route POST /api/shifts/close
router.post('/close', shiftController.closeShift);

module.exports = router;