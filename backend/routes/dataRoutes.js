
const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.get('/import-history', dataController.getImportHistory);
router.post('/import-leads', dataController.importLeads);
router.delete('/import-history/:id', dataController.deleteImportRecord);
router.post('/log-export', dataController.logExport);

module.exports = router;
