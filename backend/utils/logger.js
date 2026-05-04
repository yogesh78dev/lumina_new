
const db = require('../db');

/**
 * Robust logging utility to record system events.
 * Handles undefined values to prevent SQL binding errors.
 */
exports.logAction = async (userId, userName, roleName, title) => {
    try {
        // mysql2/promise .execute() throws if any value is 'undefined'.
        // We use the null-coalescing operator to ensure SQL NULL is passed instead.
        const params = [
            userId ?? null,
            userName ?? null,
            roleName ?? null,
            title ?? "No description provided"
        ];

        await db.execute(
            'INSERT INTO system_logs (user_id, user_name, role_name, title) VALUES (?, ?, ?, ?)',
            params
        );
    } catch (err) {
        // We log the error but don't crash the main request - logging is secondary to the business action.
        console.error('CRITICAL: System Logging Failed:', err.message);
    }
};
