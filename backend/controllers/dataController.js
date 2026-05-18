
const db = require('../db');
const { logAction } = require('../utils/logger');

exports.getImportHistory = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, file_name as fileName, total_records as totalLeads, 
                   added_by_name as addedBy, created_at as createdAt 
            FROM imported_files 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.importLeads = async (req, res) => {
    const { leads, defaults, fileName } = req.body;
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        let insertedCount = 0;
        const cleanPhone = (p) => {
            if (!p) return null;
            let phoneStr = String(p).trim();
            if (phoneStr.includes('E+') || phoneStr.includes('e+')) {
                phoneStr = Number(phoneStr).toLocaleString('fullwide', { useGrouping: false });
            }
            return phoneStr.replace(/\s+/g, '');
        };

        for (const lead of leads) {
            // Basic validation
            if (!lead.name || !lead.phone) continue;

            const phone = cleanPhone(lead.phone);
            const phone2 = cleanPhone(lead.phone2);
            const phone3 = cleanPhone(lead.phone3);
            const phone4 = cleanPhone(lead.phone4);

            // Handle date
            const createdAt = lead.createdAt || lead.created_at || lead.Date || lead.date || null;

            const [result] = await connection.execute(
                `INSERT INTO leads (name, phone, phone2, phone3, phone4, email, service, country, lead_source, lead_status, assigned_to_id, created_at, last_activity_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
                [
                    lead.name, 
                    phone, 
                    phone2,
                    phone3,
                    phone4,
                    lead.email || null, 
                    lead.service || defaults.service || null,
                    lead.country || defaults.country || 'India',
                    defaults.leadSource || 'Import',
                    defaults.leadStatus || 'New Lead',
                    defaults.assignedToId || null,
                    createdAt,
                    createdAt
                ]
            );

            // Add default note if provided
            if (defaults.note && defaults.note.trim()) {
                await connection.execute(
                    'INSERT INTO lead_notes (lead_id, content, author_name) VALUES (?, ?, ?)',
                    [result.insertId, defaults.note, req.user.name]
                );
            }
            insertedCount++;
        }

        // Log the file import history
        await connection.execute(
            'INSERT INTO imported_files (file_name, total_records, module, added_by_id, added_by_name) VALUES (?, ?, "Lead", ?, ?)',
            [fileName, insertedCount, req.user.id, req.user.name]
        );

        await logAction(req.user.id, req.user.name, req.user.role, `Imported ${insertedCount} leads from file: ${fileName}`);
        
        await connection.commit();
        res.json({ success: true, count: insertedCount });
    } catch (err) {
        await connection.rollback();
        console.error('Import failed:', err);
        res.status(500).json({ error: 'Data import failed: ' + err.message });
    } finally {
        connection.release();
    }
};

exports.deleteImportRecord = async (req, res) => {
    try {
        await db.execute('DELETE FROM imported_files WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logExport = async (req, res) => {
    const { module, count } = req.body;
    try {
        await db.execute(
            'INSERT INTO export_requests (module, exported_by_id, record_count, status) VALUES (?, ?, ?, "Completed")',
            [module, req.user.id, count]
        );
        await logAction(req.user.id, req.user.name, req.user.role, `Exported ${count} records from module: ${module}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
