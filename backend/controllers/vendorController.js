
const db = require('../db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM vendors ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching vendors:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Vendor name is required' });
    
    try {
        const [result] = await db.execute('INSERT INTO vendors (name) VALUES (?)', [name]);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('Error creating vendor:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await db.execute('UPDATE vendors SET name = ? WHERE id = ?', [name, id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating vendor:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM vendors WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting vendor:', err);
        res.status(500).json({ error: err.message });
    }
};
