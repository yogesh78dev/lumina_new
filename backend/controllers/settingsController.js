
const db = require('../db');

/**
 * Announcement Management
 */
exports.getAllAnnouncements = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, subject, content, recipients, scheduled_at as scheduledAt, author_id as authorId, created_at as createdAt FROM announcements ORDER BY scheduled_at DESC');
        const parsedRows = rows.map(ann => ({
            ...ann,
            recipients: typeof ann.recipients === 'string' ? JSON.parse(ann.recipients) : ann.recipients
        }));
        res.json(parsedRows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createAnnouncement = async (req, res) => {
    const { subject, content, recipients, scheduledAt } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO announcements (subject, content, recipients, scheduled_at, author_id) VALUES (?, ?, ?, ?, ?)',
            [subject, content, JSON.stringify(recipients), scheduledAt, req.user.id]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        await db.execute('DELETE FROM announcements WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Workflow Rule Management
 */
exports.getAllWorkflowRules = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM workflow_rules ORDER BY created_at DESC');
        const parsedRows = rows.map(rule => ({
            ...rule,
            conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions,
            actionDetails: typeof rule.action_details === 'string' ? JSON.parse(rule.action_details) : rule.action_details,
            actionType: rule.action_type,
            triggerModule: rule.trigger_module,
            triggerEvent: rule.trigger_event
        }));
        res.json(parsedRows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createWorkflowRule = async (req, res) => {
    const { name, triggerModule, triggerEvent, conditions, actionType, actionDetails } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO workflow_rules (name, trigger_module, trigger_event, conditions, action_type, action_details) VALUES (?, ?, ?, ?, ?, ?)',
            [name, triggerModule, triggerEvent, JSON.stringify(conditions), actionType, JSON.stringify(actionDetails)]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateWorkflowRule = async (req, res) => {
    const { name, triggerModule, triggerEvent, conditions, actionType, actionDetails } = req.body;
    try {
        await db.execute(
            'UPDATE workflow_rules SET name=?, trigger_module=?, trigger_event=?, conditions=?, action_type=?, action_details=? WHERE id=?',
            [name, triggerModule, triggerEvent, JSON.stringify(conditions), actionType, JSON.stringify(actionDetails), req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteWorkflowRule = async (req, res) => {
    try {
        await db.execute('DELETE FROM workflow_rules WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Permission Management
 */
exports.getAllPermissionCategories = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM permission_categories ORDER BY id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createPermissionCategory = async (req, res) => {
    const { title, status } = req.body;
    try {
        const [result] = await db.execute('INSERT INTO permission_categories (title, status) VALUES (?, ?)', [title, status]);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updatePermissionCategory = async (req, res) => {
    const { title, status } = req.body;
    try {
        await db.execute('UPDATE permission_categories SET title=?, status=? WHERE id=?', [title, status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deletePermissionCategory = async (req, res) => {
    try {
        await db.execute('DELETE FROM permission_categories WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllPermissionSections = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM permission_sections ORDER BY id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createPermissionSection = async (req, res) => {
    const { title, category, status } = req.body;
    try {
        const [result] = await db.execute('INSERT INTO permission_sections (title, category, status) VALUES (?, ?, ?)', [title, category, status]);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updatePermissionSection = async (req, res) => {
    const { title, category, status } = req.body;
    try {
        await db.execute('UPDATE permission_sections SET title=?, category=?, status=? WHERE id=?', [title, category, status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deletePermissionSection = async (req, res) => {
    try {
        await db.execute('DELETE FROM permission_sections WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Payment Gateway Settings
 */
exports.getPaymentSettings = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, gateway_name as gatewayName, api_key as apiKey, api_secret as apiSecret FROM payment_gateway_settings WHERE id = 1');
        res.json(rows[0] || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updatePaymentSettings = async (req, res) => {
    const { gatewayName, apiKey, apiSecret } = req.body;
    try {
        await db.execute('UPDATE payment_gateway_settings SET gateway_name=?, api_key=?, api_secret=? WHERE id=1', [gatewayName, apiKey, apiSecret]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
