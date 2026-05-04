
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Get all relevant messages for the current user
router.get('/', chatController.getMessagesForUser);

// Send a message
router.post('/', chatController.sendMessage);

// Mark messages from a specific user as read
router.put('/read/:senderId', chatController.markAsRead);

module.exports = router;
