const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionsController');

router.post('/', transactionController.addTransaction);

module.exports = router;