
const db = require('../db');

/**
 * Aggregates core business metrics for the dashboard
 */
exports.getStats = async (req, res) => {
    try {
        const isSuperAdmin = (req.user.role || '').toLowerCase() === 'super admin';
        const userId = req.user.id;
        
        const filter = isSuperAdmin ? '' : ' WHERE assigned_to_id = ?';
        const customerFilter = isSuperAdmin ? '' : ' WHERE sale_by_id = ?';
        const invoiceFilter = isSuperAdmin ? '' : ' AND customer_id IN (SELECT id FROM customers WHERE sale_by_id = ?)';
        
        const queries = {
            totalLeads: `SELECT COUNT(*) as count FROM leads${filter}`,
            newLeads: `SELECT COUNT(*) as count FROM leads WHERE lead_status = "New Lead"${isSuperAdmin ? '' : ' AND assigned_to_id = ?'}`,
            totalCustomers: `SELECT COUNT(*) as count FROM customers${customerFilter}`,
            totalRevenue: `SELECT SUM(amount) as total FROM invoices WHERE status = "Paid"${invoiceFilter}`,
            pipeline: `SELECT lead_status as name, COUNT(*) as count FROM leads${filter} GROUP BY lead_status`,
            recentActivity: 'SELECT title, created_at FROM system_logs ORDER BY created_at DESC LIMIT 5'
        };

        const [
            [leadsResult], 
            [newLeadsResult], 
            [customersResult], 
            [revenueResult], 
            [pipelineResult],
            [activityResult]
        ] = await Promise.all([
            db.execute(queries.totalLeads, isSuperAdmin ? [] : [userId]),
            db.execute(queries.newLeads, isSuperAdmin ? [] : [userId]),
            db.execute(queries.totalCustomers, isSuperAdmin ? [] : [userId]),
            db.execute(queries.totalRevenue, isSuperAdmin ? [] : [userId]),
            db.execute(queries.pipeline, isSuperAdmin ? [] : [userId]),
            db.execute(queries.recentActivity)
        ]);

        res.json({
            totalLeads: leadsResult[0].count,
            newLeads: newLeadsResult[0].count,
            totalCustomers: customersResult[0].count,
            totalRevenue: revenueResult[0].total || 0,
            pipeline: pipelineResult,
            recentActivity: activityResult
        });
    } catch (err) {
        console.error('Dashboard stats fetch failed:', err);
        res.status(500).json({ error: 'Failed to aggregate dashboard data' });
    }
};
