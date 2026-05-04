
const db = require('../db');

exports.getEmails = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM emails WHERE lead_id = ? ORDER BY timestamp DESC', [req.params.leadId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendEmail = async (req, res) => {
    const { leadId, from, to, subject, body } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO emails (lead_id, sender_email, receiver_email, subject, body, type) VALUES (?, ?, ?, ?, ?, "outgoing")',
            [leadId, from, to, subject, body]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getWhatsApp = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM whatsapp_messages WHERE lead_id = ? ORDER BY timestamp DESC', [req.params.leadId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendWhatsApp = async (req, res) => {
    const { leadId, content } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO whatsapp_messages (lead_id, content, type) VALUES (?, ?, "outgoing")',
            [leadId, content]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCalls = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM call_logs WHERE lead_id = ? ORDER BY timestamp DESC', [req.params.leadId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.logCall = async (req, res) => {
    const { leadId, userId, status, duration, callSid, direction } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO call_logs (lead_id, user_id, status, duration, call_sid, direction) VALUES (?, ?, ?, ?, ?, ?)',
            [leadId, userId, status, duration || 0, callSid || null, direction || 'outbound']
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
