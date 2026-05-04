
const db = require('../db');

/**
 * Internal utility to create a notification for a user
 */
exports.createNotification = async (userId, title, content, icon = 'ri-notification-3-line', iconColor = 'text-blue-500', linkTo = null) => {
    try {
        if (!userId) return;
        await db.execute(
            'INSERT INTO notifications (user_id, title, content, icon, icon_color, link_to) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, title, content, icon, iconColor, linkTo]
        );
    } catch (err) {
        console.error('Notification creation failed:', err);
    }
};

exports.getNotifications = async (req, res) => {
    try {
        // Map snake_case database columns to camelCase expected by the Frontend
        const sql = `
            SELECT 
                id, 
                user_id AS userId, 
                title, 
                content, 
                is_read AS isRead, 
                link_to AS linkTo, 
                icon, 
                icon_color AS iconColor, 
                created_at AS createdAt 
            FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        const [rows] = await db.execute(sql, [req.user.id]);
        
        // Convert numeric 1/0 to actual booleans for strict frontend types
        const formattedRows = rows.map(row => ({
            ...row,
            isRead: !!row.isRead
        }));
        
        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
