const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { verifyToken } = require('../middlewares/auth');

router.post('/close', shiftController.closeShift);
router.get('/', verifyToken, shiftController.getAllShifts);

module.exports = router;