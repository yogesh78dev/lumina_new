
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Announcements
router.get('/announcements', settingsController.getAllAnnouncements);
router.post('/announcements', settingsController.createAnnouncement);
router.delete('/announcements/:id', settingsController.deleteAnnouncement);

// Workflow Rules
router.get('/workflow-rules', settingsController.getAllWorkflowRules);
router.post('/workflow-rules', settingsController.createWorkflowRule);
router.put('/workflow-rules/:id', settingsController.updateWorkflowRule);
router.delete('/workflow-rules/:id', settingsController.deleteWorkflowRule);

// Permission Categories
router.get('/permission-categories', settingsController.getAllPermissionCategories);
router.post('/permission-categories', settingsController.createPermissionCategory);
router.put('/permission-categories/:id', settingsController.updatePermissionCategory);
router.delete('/permission-categories/:id', settingsController.deletePermissionCategory);

// Permission Sections
router.get('/permission-sections', settingsController.getAllPermissionSections);
router.post('/permission-sections', settingsController.createPermissionSection);
router.put('/permission-sections/:id', settingsController.updatePermissionSection);
router.delete('/permission-sections/:id', settingsController.deletePermissionSection);

// Payment Settings
router.get('/payment-gateway', settingsController.getPaymentSettings);
router.put('/payment-gateway', settingsController.updatePaymentSettings);

module.exports = router;
