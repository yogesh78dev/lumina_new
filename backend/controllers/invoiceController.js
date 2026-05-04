
const db = require('../db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                i.id, 
                i.customer_id AS customerId, 
                i.amount, 
                i.issued_date AS issuedDate, 
                i.due_date AS dueDate, 
                i.status, 
                c.name as customerName 
            FROM invoices i 
            LEFT JOIN customers c ON i.customer_id = c.id 
            ORDER BY i.created_at DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
    const p = req.body;
    const customerId = (p.customerId === '' || p.customerId === undefined) ? null : p.customerId;
    const amount = p.amount ?? 0;
    const dueDate = p.dueDate ?? null;
    const status = p.status ?? 'Draft';

    try {
        const [result] = await db.execute('INSERT INTO invoices (customer_id, amount, due_date, status) VALUES (?, ?, ?, ?)', [customerId, amount, dueDate, status]);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const p = req.body;
    
    // Map camelCase from frontend to database fields
    const customerId = (p.customerId === '' || p.customerId === undefined) ? null : p.customerId;
    const amount = p.amount ?? 0;
    const dueDate = p.dueDate ?? null;
    const status = p.status ?? 'Draft';
    
    try {
        // Updated to include customer_id in case it was changed during edit
        await db.execute(
            'UPDATE invoices SET customer_id=?, amount=?, due_date=?, status=? WHERE id=?', 
            [customerId, amount, dueDate, status, id]
        );
        res.json({ success: true });
    } catch (err) { 
        console.error('Update Invoice Error:', err.message);
        res.status(500).json({ error: err.message }); 
    }
};

exports.delete = async (req, res) => {
    try {
        await db.execute('DELETE FROM invoices WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
