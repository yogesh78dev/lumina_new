
const db = require('../db');

/**
 * Aggregates core business metrics for the dashboard
 */
exports.getStats = async (req, res) => {
    try {
        const queries = {
            totalLeads: 'SELECT COUNT(*) as count FROM leads',
            newLeads: 'SELECT COUNT(*) as count FROM leads WHERE lead_status = "New Lead"',
            totalCustomers: 'SELECT COUNT(*) as count FROM customers',
            totalRevenue: 'SELECT SUM(amount) as total FROM invoices WHERE status = "Paid"',
            pipeline: 'SELECT lead_status as name, COUNT(*) as count FROM leads GROUP BY lead_status',
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
            db.execute(queries.totalLeads),
            db.execute(queries.newLeads),
            db.execute(queries.totalCustomers),
            db.execute(queries.totalRevenue),
            db.execute(queries.pipeline),
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
