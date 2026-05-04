
const express = require('express');
const router = express.Router();
const commController = require('../controllers/communicationController');
const callController = require('../controllers/callController');

router.get('/emails/:leadId', commController.getEmails);
router.post('/emails', commController.sendEmail);
router.get('/whatsapp/:leadId', commController.getWhatsApp);
router.post('/whatsapp', commController.sendWhatsApp);

// Voice Call Routes (Protected)
router.post('/voice/initiate', callController.initiateCall);
router.get('/voice/logs/:leadId', callController.getCallLogs);
router.post('/voice/status/mock', callController.updateMockStatus);

module.exports = router;
