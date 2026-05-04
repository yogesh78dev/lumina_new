
const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

router.get('/', leadController.getAllLeads);
router.post('/', leadController.createLead);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

// Bulk Operations
router.post('/bulk-assign', leadController.bulkAssign);
router.post('/bulk-status', leadController.bulkStatus);
router.post('/bulk-delete', leadController.bulkDelete);

// Special Operations
router.post('/convert/:id', leadController.convertToCustomer);

// Activity (Notes)
router.get('/:id/notes', leadController.getNotes);
router.post('/:id/notes', leadController.addNote);
router.put('/:id/notes/:noteId', leadController.updateNote);
router.delete('/:id/notes/:noteId', leadController.deleteNote);

// Activity (Reminders)
router.get('/reminders/all', leadController.getAllReminders);
router.get('/:id/reminders', leadController.getReminders);
router.post('/:id/reminders', leadController.addReminder);
router.put('/:id/reminders/:reminderId', leadController.updateReminder);
router.delete('/:id/reminders/:reminderId', leadController.deleteReminder);
router.put('/reminders/:id/toggle', leadController.toggleReminder);

// Activity (Documents)
router.get('/:id/documents', leadController.getDocuments);
router.post('/:id/documents', leadController.addDocument);
router.put('/:id/documents/:docId', leadController.updateDocument);
router.delete('/:id/documents/:docId', leadController.deleteDocument);

module.exports = router;
