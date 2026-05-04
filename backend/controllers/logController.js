
const db = require('../db');

exports.getSystemLogs = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                id, 
                user_id as userId, 
                user_name as userName, 
                role_name as role, 
                title, 
                created_at as createdAt 
            FROM system_logs 
            ORDER BY created_at DESC 
            LIMIT 500
        `);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.getUserActivityLogs = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                id, 
                user_id as userId, 
                ip_address as ipAddress, 
                user_agent as userAgent, 
                login_date as loginDate, 
                logout_date as logoutDate, 
                status, 
                location 
            FROM user_activity_logs 
            WHERE user_id = ? 
            ORDER BY login_date DESC
            LIMIT 100
        `, [req.params.userId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addSystemLog = async (req, res) => {
    const { userId, userName, roleName, title } = req.body;
    try {
        await db.execute(
            'INSERT INTO system_logs (user_id, user_name, role_name, title) VALUES (?, ?, ?, ?)',
            [userId ?? null, userName ?? null, roleName ?? null, title ?? "No Title"]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
