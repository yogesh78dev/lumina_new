
const db = require('../db');
const { logAction } = require('../utils/logger');
const { createNotification } = require('./notificationController');
const { PHONE_VALIDATION_MESSAGE, normalizePhoneNumber, isValidPhoneNumber } = require('../utils/phoneValidation');

let leadColumnsReady = false;

const ensureLeadColumns = async () => {
    if (leadColumnsReady) return;
    const [leadTypeColumns] = await db.execute('SHOW COLUMNS FROM leads LIKE "lead_type"');
    if (leadTypeColumns.length === 0) {
        await db.execute('ALTER TABLE leads ADD COLUMN lead_type VARCHAR(100) NULL AFTER service');
    }
    const [categoryColumns] = await db.execute('SHOW COLUMNS FROM leads LIKE "lead_category"');
    if (categoryColumns.length === 0) {
        await db.execute('ALTER TABLE leads ADD COLUMN lead_category VARCHAR(100) NULL AFTER service');
    }
    leadColumnsReady = true;
};

const toSqlDate = (input) => {
    if (!input) return null;
    const raw = String(input).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return raw.slice(0, 10);
    }
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
};

const validateAndNormalizeLeadPhones = (payload) => {
    const fields = ['phone', 'phone2', 'phone3', 'phone4'];
    const normalized = {};
    const errors = [];

    for (const field of fields) {
        const raw = String(payload[field] ?? '').trim();
        if (field === 'phone' && !raw) {
            errors.push('Phone Number 1 is required');
            continue;
        }
        if (raw && !isValidPhoneNumber(raw)) {
            const label = field === 'phone' ? 'Phone Number 1' : `Phone Number ${field.replace('phone', '')}`;
            errors.push(`${label} is invalid. ${PHONE_VALIDATION_MESSAGE}`);
            continue;
        }
        normalized[field] = raw ? normalizePhoneNumber(raw) : null;
    }

    return { normalized, errors };
};

exports.getAllLeads = async (req, res) => {
    try {
        await ensureLeadColumns();
        const isSuperAdmin = (req.user.role || '').toLowerCase() === 'super admin';
        let sql = `
            SELECT 
                l.id, l.name, l.phone, l.phone2, l.phone3, l.phone4, l.email, l.service, l.lead_type AS leadType, l.lead_category AS leadCategory, l.country, 
                l.lead_source AS leadSource, l.lead_status AS leadStatus,
                l.company_name AS companyName, l.location, l.assigned_to_id AS assignedToId, 
                l.last_activity_at AS lastActivityAt, l.created_at AS createdAt, DATE_FORMAT(l.lead_date, '%Y-%m-%d') AS leadDate,
                l.created_by AS createdById, creator.name AS createdByName,
                (SELECT COUNT(*) FROM lead_notes WHERE lead_id = l.id) AS notesCount,
                (SELECT COUNT(*) FROM lead_reminders WHERE lead_id = l.id AND is_completed = 0) AS remindersCount,
                (SELECT content FROM lead_notes WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) AS latestNote
            FROM leads l
            LEFT JOIN users creator ON creator.id = l.created_by
        `;
        
        const params = [];
        if (!isSuperAdmin) {
            sql += ' WHERE l.assigned_to_id = ?';
            params.push(req.user.id);
        }
        
        sql += ' ORDER BY l.created_at DESC';
        
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (err) { 
        console.error('Fetch Leads Error:', err);
        res.status(500).json({ error: 'Internal Server Error' }); 
    }
};

exports.createLead = async (req, res) => {
    const p = req.body;
    const isSuperAdmin = (req.user.role || '').toLowerCase() === 'super admin';
    const leadDate = toSqlDate(p.leadDate ?? p.createdAt);
    const phoneValidation = validateAndNormalizeLeadPhones(p);
    if (phoneValidation.errors.length > 0) {
        return res.status(400).json({ error: phoneValidation.errors.join('; ') });
    }
    
    // Default assigned_to_id to current user if not provided and NOT super admin
    let assignedToId = (p.assignedToId === "" || p.assignedToId === undefined) ? null : p.assignedToId;
    if (!assignedToId && !isSuperAdmin) {
        assignedToId = req.user.id;
    }
    
    const fields = [
        p.name ?? "",
        phoneValidation.normalized.phone,
        phoneValidation.normalized.phone2,
        phoneValidation.normalized.phone3,
        phoneValidation.normalized.phone4,
        p.email ?? null,
        p.service ?? null,
        p.leadType ?? null,
        p.leadCategory ?? null,
        p.country ?? null,
        p.leadSource ?? null,
        p.leadStatus ?? 'New Lead',
        p.companyName ?? null,
        p.location ?? null,
        assignedToId,
        leadDate,
        req.user.id
    ];

    try {
        await ensureLeadColumns();

        const [result] = await db.execute(
            `INSERT INTO leads (name, phone, phone2, phone3, phone4, email, service, lead_type, lead_category, country, lead_source, lead_status, company_name, location, assigned_to_id, lead_date, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            fields
        );

        if (p.remarks && String(p.remarks).trim()) {
            await db.execute(
                'INSERT INTO lead_notes (lead_id, content, author_name) VALUES (?, ?, ?)',
                [result.insertId, String(p.remarks).trim(), req.user.name || 'System']
            );
        }
        
        await logAction(req.user.id, req.user.name, req.user.role, `Created new lead: ${p.name}`);
        
        if (p.assignedToId) {
            await createNotification(
                p.assignedToId,
                'New Lead Assigned',
                `You have been assigned a new lead: ${p.name}`,
                'ri-user-add-line',
                'text-blue-500',
                `/leads/${result.insertId}`
            );
        }

        res.json({ success: true, id: result.insertId });
    } catch (err) { 
        console.error('Lead SQL Error:', err.message);
        res.status(500).json({ error: err.message }); 
    }
};

exports.updateLead = async (req, res) => {
    const { id } = req.params;
    const p = req.body; 
    const phoneValidation = validateAndNormalizeLeadPhones(p);
    if (phoneValidation.errors.length > 0) {
        return res.status(400).json({ error: phoneValidation.errors.join('; ') });
    }
    
    try {
        await ensureLeadColumns();
        const [[oldLead]] = await db.execute('SELECT assigned_to_id FROM leads WHERE id = ?', [id]);
        if (!oldLead) return res.status(404).json({ error: 'Lead not found' });

        const isSuperAdmin = (req.user.role || '').toLowerCase() === 'super admin';
        if (!isSuperAdmin && oldLead.assigned_to_id && String(oldLead.assigned_to_id) !== String(req.user.id)) {
            return res.status(403).json({ error: 'Access denied. You can only update your own leads.' });
        }

        // Map camelCase Frontend props to correct Database/Query fields
        const fields = [
            p.name ?? "",
            phoneValidation.normalized.phone,
            phoneValidation.normalized.phone2,
            phoneValidation.normalized.phone3,
            phoneValidation.normalized.phone4,
            p.email ?? null,
            p.service ?? null,
            p.leadType ?? null,
            p.leadCategory ?? null,
            p.country ?? null,
            p.leadSource ?? null,
            p.leadStatus ?? 'New Lead',
            p.companyName ?? null,
            p.location ?? null,
            (p.assignedToId === "" || p.assignedToId === undefined) ? null : p.assignedToId,
            toSqlDate(p.leadDate ?? p.createdAt),
            id
        ];
        // console.log("fields",fields);
        

        await db.execute(
            `UPDATE leads SET 
                name=?, phone=?, phone2=?, phone3=?, phone4=?, email=?, service=?, lead_type=?, lead_category=?, country=?, 
                lead_source=?, lead_status=?, company_name=?, location=?, 
                assigned_to_id=?, lead_date=COALESCE(?, lead_date), last_activity_at=CURRENT_TIMESTAMP 
             WHERE id=?`,
            fields
        );

        if (p.remarks && String(p.remarks).trim()) {
            const remarkText = String(p.remarks).trim();
            const [[latestNote]] = await db.execute(
                'SELECT content FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1',
                [id]
            );
            if (!latestNote || String(latestNote.content || '').trim() !== remarkText) {
                await db.execute(
                    'INSERT INTO lead_notes (lead_id, content, author_name) VALUES (?, ?, ?)',
                    [id, remarkText, req.user.name || 'System']
                );
            }
        }
        
        await logAction(req.user.id, req.user.name, req.user.role, `Updated lead information for: ${p.name}`);
        
        // Notify if assignee changed - use camelCase check
        if (p.assignedToId && String(p.assignedToId) !== String(oldLead?.assigned_to_id)) {
            await createNotification(
                p.assignedToId,
                'Lead Re-assigned',
                `Lead "${p.name}" has been transferred to you.`,
                'ri-exchange-box-line',
                'text-purple-500',
                `/leads/${id}`
            );
        }

        res.json({ success: true });
    } catch (err) { 
        console.error('Update Lead Error:', err.message);
        res.status(500).json({ error: err.message }); 
    }
};

exports.deleteLead = async (req, res) => {
    const { id } = req.params;
    try {
        const [[lead]] = await db.execute('SELECT name, assigned_to_id FROM leads WHERE id = ?', [id]);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const isSuperAdmin = (req.user.role || '').toLowerCase() === 'super admin';
        if (!isSuperAdmin && lead.assigned_to_id && String(lead.assigned_to_id) !== String(req.user.id)) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        await db.execute('DELETE FROM leads WHERE id = ?', [id]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Permanently deleted lead: ${lead.name}`);
        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.bulkAssign = async (req, res) => {
    const { ids, userId } = req.body;
    try {
        const targetUserId = (userId === "" || userId === undefined) ? null : userId;
        await db.query('UPDATE leads SET assigned_to_id = ? WHERE id IN (?)', [targetUserId, ids]);
        
        const [[user]] = await db.execute('SELECT name FROM users WHERE id = ?', [targetUserId]);
        const assigneeName = user ? user.name : 'Unassigned';
        await logAction(req.user.id, req.user.name, req.user.role, `Bulk assigned ${ids.length} leads to ${assigneeName}`);
        
        if (targetUserId) {
            await createNotification(
                targetUserId,
                'Bulk Assignment',
                `You have been assigned ${ids.length} leads in bulk.`,
                'ri-group-line',
                'text-blue-600',
                '/leads'
            );
        }

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.bulkStatus = async (req, res) => {
    const { ids, status } = req.body;
    try {
        await db.query('UPDATE leads SET lead_status = ? WHERE id IN (?)', [status, ids]);
        await logAction(req.user.id, req.user.name, req.user.role, `Bulk updated ${ids.length} leads to status: ${status}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.bulkDelete = async (req, res) => {
    const { ids } = req.body;
    try {
        await db.query('DELETE FROM leads WHERE id IN (?)', [ids]);
        await logAction(req.user.id, req.user.name, req.user.role, `Bulk deleted ${ids.length} lead records`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.convertToCustomer = async (req, res) => {
    const { id } = req.params;
    let { customerIdString, saleById, closeDate } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [[lead]] = await connection.execute('SELECT * FROM leads WHERE id = ?', [id]);
        if (!lead) throw new Error('Lead not found');

        const targetSaleById = (saleById === "" || saleById === undefined) ? null : saleById;
        const sql = `INSERT INTO customers (customer_id_string, name, phone, email, country, company_name, location, sale_by_id, close_date, passport_status, service_type) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await connection.execute(sql, [customerIdString ?? null, lead.name, lead.phone, lead.email, lead.country, lead.company_name, lead.location, targetSaleById, closeDate ?? null, lead.passport_status, lead.service]);
        await connection.execute('UPDATE leads SET lead_status = "Won", last_activity_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Converted lead to customer: ${lead.name}`);
        
        if (targetSaleById) {
            await createNotification(
                targetSaleById,
                'New Sale Won! 🎉',
                `Lead "${lead.name}" has been successfully converted to a customer.`,
                'ri-trophy-line',
                'text-yellow-500',
                '/customers'
            );
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
};

exports.getNotes = async (req, res) => {
    const { id } = req.params;
    try {
        const isSuperAdmin = (req.user.role || '').toLowerCase() === 'super admin';
        if (!isSuperAdmin) {
            const [[lead]] = await db.execute('SELECT assigned_to_id FROM leads WHERE id = ?', [id]);
            if (!lead || (lead.assigned_to_id && String(lead.assigned_to_id) !== String(req.user.id))) {
                return res.status(403).json({ error: 'Access denied.' });
            }
        }
        const [rows] = await db.execute('SELECT id, lead_id AS leadId, content, author_name AS author, created_at AS createdAt FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC', [id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addNote = async (req, res) => {
    const { content = '', author = 'System' } = req.body;
    try {
        const [[lead]] = await db.execute('SELECT name FROM leads WHERE id = ?', [req.params.id]);
        const [result] = await db.execute('INSERT INTO lead_notes (lead_id, content, author_name) VALUES (?, ?, ?)', [req.params.id, content, author]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Added a remark to lead: ${lead?.name || 'Unknown'}`);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateNote = async (req, res) => {
    const { content = '' } = req.body;
    try {
        const [[note]] = await db.execute('SELECT l.name FROM lead_notes n JOIN leads l ON n.lead_id = l.id WHERE n.id = ?', [req.params.noteId]);
        await db.execute('UPDATE lead_notes SET content = ? WHERE id = ?', [content, req.params.noteId]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Updated a remark on lead: ${note?.name || 'Unknown'}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteNote = async (req, res) => {
    try {
        const [[note]] = await db.execute('SELECT l.name FROM lead_notes n JOIN leads l ON n.lead_id = l.id WHERE n.id = ?', [req.params.noteId]);
        await db.execute('DELETE FROM lead_notes WHERE id = ?', [req.params.noteId]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Deleted a remark from lead: ${note?.name || 'Unknown'}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getReminders = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, lead_id AS leadId, note, due_date AS dueDate, is_completed AS isCompleted FROM lead_reminders WHERE lead_id = ? ORDER BY due_date ASC', [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addReminder = async (req, res) => {
    const { note = '', dueDate = null } = req.body;
    try {
        const [[lead]] = await db.execute('SELECT name FROM leads WHERE id = ?', [req.params.id]);
        const [result] = await db.execute('INSERT INTO lead_reminders (lead_id, note, due_date) VALUES (?, ?, ?)', [req.params.id, note, dueDate]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Set a new task for lead: ${lead?.name || 'Unknown'}`);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateReminder = async (req, res) => {
    const { note = '', dueDate = null } = req.body;
    try {
        const [[rem]] = await db.execute('SELECT l.name FROM lead_reminders r JOIN leads l ON r.lead_id = l.id WHERE r.id = ?', [req.params.reminderId]);
        await db.execute('UPDATE lead_reminders SET note = ?, due_date = ? WHERE id = ?', [note, dueDate, req.params.reminderId]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Updated task details for lead: ${rem?.name || 'Unknown'}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteReminder = async (req, res) => {
    try {
        const [[rem]] = await db.execute('SELECT l.name FROM lead_reminders r JOIN leads l ON r.lead_id = l.id WHERE r.id = ?', [req.params.reminderId]);
        await db.execute('DELETE FROM lead_reminders WHERE id = ?', [req.params.reminderId]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Removed a task from lead: ${rem?.name || 'Unknown'}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleReminder = async (req, res) => {
    try {
        const [[rem]] = await db.execute('SELECT l.name, r.is_completed FROM lead_reminders r JOIN leads l ON r.lead_id = l.id WHERE r.id = ?', [req.params.id]);
        await db.execute('UPDATE lead_reminders SET is_completed = NOT is_completed WHERE id = ?', [req.params.id]);
        
        const action = rem?.is_completed ? 're-opened' : 'completed';
        await logAction(req.user.id, req.user.name, req.user.role, `Marked task as ${action} for lead: ${rem?.name || 'Unknown'}`);
        
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllReminders = async (req, res) => {
    try {
        const isSuperAdmin = (req.user.role || '').toLowerCase() === 'super admin';
        let sql = `
            SELECT r.id, r.lead_id AS leadId, r.note, r.due_date AS dueDate, r.is_completed AS isCompleted 
            FROM lead_reminders r
            JOIN leads l ON r.lead_id = l.id
        `;
        const params = [];
        if (!isSuperAdmin) {
            sql += ' WHERE l.assigned_to_id = ?';
            params.push(req.user.id);
        }
        sql += ' ORDER BY r.due_date ASC';
        
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getDocuments = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, lead_id AS leadId, name, status, file_name AS fileName, file_type AS fileType, file_data AS fileData, notes, created_at AS createdAt FROM lead_documents WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addDocument = async (req, res) => {
    const { name = '', status = 'Pending' } = req.body;
    try {
        const [[lead]] = await db.execute('SELECT name FROM leads WHERE id = ?', [req.params.id]);
        const [result] = await db.execute('INSERT INTO lead_documents (lead_id, name, status) VALUES (?, ?, ?)', [req.params.id, name, status]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Added document placeholder (${name}) for lead: ${lead?.name || 'Unknown'}`);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateDocument = async (req, res) => {
    const { status, fileName, fileType, fileData, notes } = req.body;
    const { docId } = req.params;
    try {
        const [[doc]] = await db.execute('SELECT l.name, d.name as docName FROM lead_documents d JOIN leads l ON d.lead_id = l.id WHERE d.id = ?', [docId]);
        
        let sql = 'UPDATE lead_documents SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        if (status) { sql += ', status = ?'; params.push(status); }
        if (fileName) { sql += ', file_name = ?'; params.push(fileName); }
        if (fileType) { sql += ', file_type = ?'; params.push(fileType); }
        if (fileData) { sql += ', file_data = ?'; params.push(fileData); }
        if (notes !== undefined) { sql += ', notes = ?'; params.push(notes); }
        sql += ' WHERE id = ?';
        params.push(docId);
        await db.execute(sql, params);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Updated document status/file for ${doc?.docName} on lead: ${doc?.name || 'Unknown'}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteDocument = async (req, res) => {
    try {
        const [[doc]] = await db.execute('SELECT l.name, d.name as docName FROM lead_documents d JOIN leads l ON d.lead_id = l.id WHERE d.id = ?', [req.params.docId]);
        await db.execute('DELETE FROM lead_documents WHERE id = ?', [req.params.docId]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Removed document ${doc?.docName} from lead: ${doc?.name || 'Unknown'}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
