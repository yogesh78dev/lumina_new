
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.get('/system', logController.getSystemLogs);
router.get('/user/:userId', logController.getUserActivityLogs);
router.post('/system', logController.addSystemLog);

module.exports = router;
