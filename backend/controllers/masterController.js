
const db = require('../db');

/**
 * Map frontend route types to physical database table names
 */
const tableMap = {
    'lead-source': 'lead_sources',
    'lead-status': 'lead_statuses',
    'lead-category': 'lead_categories',
    'application-status': 'application_statuses',
    'passport-status': 'passport_statuses',
    'document-type': 'document_types',
    'remark-status': 'remark_statuses',
    'service-type': 'service_types',
    'lost-reason': 'lost_reasons',
    'sale-by': 'sale_by',
    'worked-by': 'worked_by'
};

/**
 * Create a new master data entry
 */
exports.createItem = async (req, res) => {
    const table = tableMap[req.params.type];
    if (!table) return res.status(400).json({ error: 'Invalid master data type' });
    
    try {
        const name = String(req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const [existing] = await db.execute(
            `SELECT id FROM ${table} WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1`,
            [name]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: `${req.body.name} already exists.` });
        }

        // Handle entities with status (like sale_by/worked_by)
        const hasStatus = ['sale_by', 'worked_by'].includes(table);
        const isLeadStatus = table === 'lead_statuses';
        const sql = hasStatus
            ? `INSERT INTO ${table} (name, status) VALUES (?, ?)`
            : isLeadStatus
                ? `INSERT INTO ${table} (name, color, progress) VALUES (?, ?, ?)`
                : `INSERT INTO ${table} (name) VALUES (?)`;
        
        const params = hasStatus
            ? [name, req.body.status || 'Active']
            : isLeadStatus
                ? [name, req.body.color || '#2563eb', Number(req.body.progress ?? 0)]
                : [name];

        const [result] = await db.execute(sql, params);
        res.json({ success: true, id: result.insertId });
    } catch (err) { 
        console.error(`Error creating master item in ${table}:`, err);
        res.status(500).json({ error: err.message }); 
    }
};

/**
 * Update a master data entry
 */
exports.updateItem = async (req, res) => {
    const table = tableMap[req.params.type];
    if (!table) return res.status(400).json({ error: 'Invalid master data type' });
    
    try {
        const name = String(req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const [existing] = await db.execute(
            `SELECT id FROM ${table} WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id <> ? LIMIT 1`,
            [name, req.params.id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: `${req.body.name} already exists.` });
        }

        const hasStatus = ['sale_by', 'worked_by'].includes(table);
        const isLeadStatus = table === 'lead_statuses';
        const sql = hasStatus
            ? `UPDATE ${table} SET name = ?, status = ? WHERE id = ?`
            : isLeadStatus
                ? `UPDATE ${table} SET name = ?, color = ?, progress = ? WHERE id = ?`
            : `UPDATE ${table} SET name = ? WHERE id = ?`;
            
        const params = hasStatus
            ? [name, req.body.status, req.params.id]
            : isLeadStatus
                ? [name, req.body.color || '#2563eb', Number(req.body.progress ?? 0), req.params.id]
            : [name, req.params.id];

        await db.execute(sql, params);
        res.json({ success: true });
    } catch (err) { 
        console.error(`Error updating master item in ${table}:`, err);
        res.status(500).json({ error: err.message }); 
    }
};

/**
 * Delete a master data entry
 */
exports.deleteItem = async (req, res) => {
    const table = tableMap[req.params.type];
    if (!table) return res.status(400).json({ error: 'Invalid master data type' });
    
    try {
        await db.execute(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { 
        console.error(`Error deleting master item in ${table}:`, err);
        res.status(500).json({ error: err.message }); 
    }
};
