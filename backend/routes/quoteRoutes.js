
const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

router.get('/lead/:leadId', quoteController.getQuotesByLead);
router.post('/', quoteController.createQuote);
router.put('/:id', quoteController.updateQuote);

module.exports = router;
