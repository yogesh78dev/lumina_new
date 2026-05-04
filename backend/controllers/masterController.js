
const db = require('../db');

/**
 * Map frontend route types to physical database table names
 */
const tableMap = {
    'lead-source': 'lead_sources',
    'lead-status': 'lead_statuses',
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
        // Handle entities with status (like sale_by/worked_by)
        const hasStatus = ['sale_by', 'worked_by'].includes(table);
        const sql = hasStatus 
            ? `INSERT INTO ${table} (name, status) VALUES (?, ?)`
            : `INSERT INTO ${table} (name) VALUES (?)`;
        
        const params = hasStatus 
            ? [req.body.name, req.body.status || 'Active']
            : [req.body.name];

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
        const hasStatus = ['sale_by', 'worked_by'].includes(table);
        const sql = hasStatus
            ? `UPDATE ${table} SET name = ?, status = ? WHERE id = ?`
            : `UPDATE ${table} SET name = ? WHERE id = ?`;
            
        const params = hasStatus
            ? [req.body.name, req.body.status, req.params.id]
            : [req.body.name, req.params.id];

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
