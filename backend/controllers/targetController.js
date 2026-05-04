
const db = require('../db');

exports.getAllTargets = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                t.id, 
                t.user_id as userId, 
                t.target_amount as targetAmount, 
                t.achieve_amount as achieveAmount, 
                t.status, 
                t.module, 
                u.name as userName 
            FROM targets t 
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTarget = async (req, res) => {
    const p = req.body;
    const userId = p.userId ?? null;
    const targetAmount = p.targetAmount ?? 0;
    const achieveAmount = p.achieveAmount ?? 0;
    const status = p.status ?? 'Active';
    const module = p.module ?? 'Lead';

    try {
        const [result] = await db.execute(
            'INSERT INTO targets (user_id, target_amount, achieve_amount, status, module) VALUES (?, ?, ?, ?, ?)',
            [userId, targetAmount, achieveAmount, status, module]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTarget = async (req, res) => {
    try {
        await db.execute('DELETE FROM targets WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
