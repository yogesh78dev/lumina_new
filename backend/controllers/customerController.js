
const db = require('../db');
const { logAction } = require('../utils/logger');

exports.getAll = async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, customer_id_string AS customerId, name, phone, email, country, 
                company_name AS companyName, gst_number AS gstNumber, location, 
                vendor_id AS vendorId, sale_by_id AS saleById, service_type AS serviceType, 
                close_date AS closeDate, action, passport_status AS passportStatus, 
                created_at AS createdAt 
            FROM customers 
            ORDER BY created_at DESC
        `;
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (err) { 
        console.error('Customer fetch error:', err);
        res.status(500).json({ error: err.message }); 
    }
};

exports.create = async (req, res) => {
    const p = req.body;
    
    const fields = [
        p.customerId ?? null,
        p.name ?? "",
        p.phone ?? "",
        p.email ?? null,
        p.country ?? null,
        p.companyName ?? null,
        p.gstNumber ?? null,
        p.location ?? null,
        (p.vendorId === "" || p.vendorId === undefined) ? null : p.vendorId,
        (p.saleById === "" || p.saleById === undefined) ? null : p.saleById,
        p.serviceType ?? null,
        p.closeDate ?? null,
        p.action ?? null,
        p.passportStatus ?? 'With Client'
    ];

    const sql = `INSERT INTO customers (customer_id_string, name, phone, email, country, company_name, gst_number, location, vendor_id, sale_by_id, service_type, close_date, action, passport_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        const [result] = await db.execute(sql, fields);
        await logAction(req.user.id, req.user.name, req.user.role, `System: Manual creation of customer ${p.name}`);
        res.json({ success: true, id: result.insertId });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const p = req.body;
    
    const fields = [
        p.name ?? "",
        p.phone ?? "",
        p.email ?? null,
        p.country ?? null,
        p.companyName ?? null,
        p.gstNumber ?? null,
        p.location ?? null,
        (p.vendorId === "" || p.vendorId === undefined) ? null : p.vendorId,
        (p.saleById === "" || p.saleById === undefined) ? null : p.saleById,
        p.serviceType ?? null,
        p.closeDate ?? null,
        p.action ?? null,
        p.passportStatus ?? null,
        id
    ];

    const sql = `UPDATE customers SET name=?, phone=?, email=?, country=?, company_name=?, gst_number=?, location=?, vendor_id=?, sale_by_id=?, service_type=?, close_date=?, action=?, passport_status=? WHERE id=?`;
    try {
        await db.execute(sql, fields);
        await logAction(req.user.id, req.user.name, req.user.role, `System: Updated information for customer ${p.name}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.delete = async (req, res) => {
    try {
        const [[cust]] = await db.execute('SELECT name FROM customers WHERE id = ?', [req.params.id]);
        await db.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
        
        if (cust) {
            await logAction(req.user.id, req.user.name, req.user.role, `System: Deleted customer record for ${cust.name}`);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
