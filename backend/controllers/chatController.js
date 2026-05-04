
const db = require('../db');

/**
 * Get all messages involving the current user (sent or received)
 */
exports.getMessagesForUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute(
            'SELECT id, sender_id as senderId, receiver_id as receiverId, content, timestamp, is_read as isRead FROM chat_messages WHERE sender_id = ? OR receiver_id = ? ORDER BY timestamp ASC',
            [userId, userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Send a new chat message
 */
exports.sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;
    
    if (!receiverId || !content) {
        return res.status(400).json({ error: 'Receiver and content are required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO chat_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiverId, content]
        );
        res.json({ success: true, id: result.insertId, timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Mark all messages from a specific sender to the current user as read
 */
exports.markAsRead = async (req, res) => {
    const { senderId } = req.params;
    const userId = req.user.id;

    try {
        await db.execute(
            'UPDATE chat_messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [senderId, userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
