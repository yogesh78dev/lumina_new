
const db = require('../db');

/**
 * Fetch all quotes for a specific lead with mapped column names
 */
exports.getQuotesByLead = async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, 
                lead_id AS leadId, 
                quote_number AS quoteNumber, 
                created_at AS createdAt, 
                valid_until AS validUntil, 
                status, 
                subtotal, 
                tax, 
                total 
            FROM quotes 
            WHERE lead_id = ?
            ORDER BY created_at DESC
        `;
        const [quotes] = await db.execute(sql, [req.params.leadId]);
        
        // For each quote, fetch its associated items
        for (let quote of quotes) {
            const [items] = await db.execute('SELECT id, description, quantity, price, total FROM quote_items WHERE quote_id = ?', [quote.id]);
            quote.items = items;
        }
        
        res.json(quotes);
    } catch (err) { 
        console.error('Error fetching quotes by lead:', err);
        res.status(500).json({ error: err.message }); 
    }
};

/**
 * Create a new quote and its items within a transaction
 */
exports.createQuote = async (req, res) => {
    const { leadId, quoteNumber, validUntil, status, items, subtotal, tax, total } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Insert master quote record
        const [qResult] = await connection.execute(
            'INSERT INTO quotes (lead_id, quote_number, valid_until, status, subtotal, tax, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [leadId, quoteNumber, validUntil, status, subtotal, tax, total]
        );
        const quoteId = qResult.insertId;

        // 2. Insert line items
        if (items && items.length > 0) {
            for (let item of items) {
                await connection.execute(
                    'INSERT INTO quote_items (quote_id, description, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
                    [quoteId, item.description, item.quantity, item.price, item.total]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, id: quoteId });
    } catch (err) {
        await connection.rollback();
        console.error('Transaction rollback in createQuote:', err);
        res.status(500).json({ error: err.message });
    } finally { 
        connection.release(); 
    }
};

/**
 * Update an existing quote and sync its items
 */
exports.updateQuote = async (req, res) => {
    const { id } = req.params;
    const { validUntil, status, items, subtotal, tax, total } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Update master record
        await connection.execute(
            'UPDATE quotes SET valid_until = ?, status = ?, subtotal = ?, tax = ?, total = ? WHERE id = ?',
            [validUntil, status, subtotal, tax, total, id]
        );

        // 2. Synchronize items (Clear and replace strategy)
        await connection.execute('DELETE FROM quote_items WHERE quote_id = ?', [id]);
        if (items && items.length > 0) {
            for (let item of items) {
                await connection.execute(
                    'INSERT INTO quote_items (quote_id, description, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
                    [id, item.description, item.quantity, item.price, item.total]
                );
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error('Transaction rollback in updateQuote:', err);
        res.status(500).json({ error: err.message });
    } finally { 
        connection.release(); 
    }
};
