
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

/**
 * Application Handshake: Fetches all core configurations, master data, 
 * users, and roles to initialize the frontend global context state.
 */
router.get('/all', configController.getHandshake);

/**
 * Update global company profile
 */
router.put('/company', configController.updateCompany);

/**
 * Update Email API Credentials
 */
router.put('/email-credentials', configController.updateEmailCredentials);

/**
 * Update Mobile API Credentials
 */
router.put('/mobile-credentials', configController.updateMobileCredentials);

module.exports = router;
