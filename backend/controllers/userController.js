
const db = require('../db');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/logger');

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                u.id, u.name, u.username, u.email, u.role_id as roleId, 
                COALESCE(r.name, u.role_name) as role, 
                u.status, u.image_url 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createUser = async (req, res) => {
    const p = req.body;
    const name = p.name ?? '';
    const username = p.username ?? '';
    const email = p.email ?? '';
    const password = p.password ?? 'password123';
    const roleId = (p.roleId === "" || p.roleId === undefined) ? null : p.roleId;
    const role = p.role ?? null;
    const status = p.status ?? 'Active';
    const imageUrl = p.imageUrl ?? null;
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.execute(
            'INSERT INTO users (name, username, email, password, role_id, role_name, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, username, email, hashedPassword, roleId, role, status, imageUrl]
        );
        
        await logAction(req.user.id, req.user.name, req.user.role, `Created user: ${name}`);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Senior Implementation: Dynamic Update
 * Prevents blanking out columns when only partial data (like imageUrl) is sent.
 */
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const p = req.body;
    
    try {
        // 1. Map Frontend keys to Database columns
        const mapping = {
            name: 'name',
            username: 'username',
            email: 'email',
            roleId: 'role_id',
            role: 'role_name',
            status: 'status',
            imageUrl: 'image_url'
        };

        const updateFields = [];
        const params = [];

        // 2. Build Dynamic SET clause
        for (const [frontKey, dbColumn] of Object.entries(mapping)) {
            if (p[frontKey] !== undefined) {
                updateFields.push(`${dbColumn} = ?`);
                // Handle empty string conversion to null for specific fields if needed
                const value = (p[frontKey] === "" && (frontKey === 'roleId')) ? null : p[frontKey];
                params.push(value);
            }
        }

        // 3. Special handling for password hashing
        if (p.password && p.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(p.password, salt);
            updateFields.push('password = ?');
            params.push(hashedPassword);
        }

        // If no fields to update, just return success
        if (updateFields.length === 0) {
            return res.json({ success: true, message: 'No fields to update' });
        }

        // 4. Execute Query
        const sql = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        params.push(id);
        
        await db.execute(sql, params);

        // Log the change
        const logMsg = p.name ? `Updated user info for: ${p.name}` : `Updated profile settings for user ID: ${id}`;
        await logAction(req.user.id, req.user.name, req.user.role, logMsg);

        res.json({ success: true });
    } catch (err) { 
        console.error('Update User Error:', err.message);
        res.status(500).json({ error: err.message }); 
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        // 1. Prevent self-deletion
        if (String(id) === String(req.user.id)) {
            return res.status(400).json({ error: 'You cannot delete your own account while logged in.' });
        }

        // 2. Fetch target user info
        const [[targetUser]] = await db.execute('SELECT name, role_name as role FROM users WHERE id = ?', [id]);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        // 3. Prevent lower roles from deleting higher ones
        const requesterRole = req.user.role.toLowerCase();
        const targetRole = targetUser.role.toLowerCase();

        if (targetRole === 'super admin' && requesterRole !== 'super admin') {
            return res.status(403).json({ error: 'Permission Denied: Only Super Admins can delete other Super Admin accounts.' });
        }

        // 4. Manually handle dependencies that don't have ON DELETE CASCADE in current production schema
        // We do this in a specific order to avoid foreign key violations.
        // We use a transaction-like approach (manual sequence)
        
        // Communications & Internal Messaging
        await db.execute('DELETE FROM chat_messages WHERE sender_id = ? OR receiver_id = ?', [id, id]);
        await db.execute('DELETE FROM notifications WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM call_logs WHERE user_id = ?', [id]);
        
        // Activity & History
        await db.execute('DELETE FROM user_activity_logs WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM system_logs WHERE user_id = ?', [id]);
        
        // Targets & Perfromance
        await db.execute('DELETE FROM targets WHERE user_id = ?', [id]);
        
        // References in other tables (Set to NULL or handled by schema if possible, 
        // but explicit updates are safer if constraints are strict)
        await db.execute('UPDATE leads SET assigned_to_id = NULL WHERE assigned_to_id = ?', [id]);
        await db.execute('UPDATE customers SET sale_by_id = NULL WHERE sale_by_id = ?', [id]);
        await db.execute('UPDATE lead_notes SET author_id = NULL WHERE author_id = ?', [id]);
        await db.execute('UPDATE imported_files SET added_by_id = NULL WHERE added_by_id = ?', [id]);
        await db.execute('UPDATE export_requests SET exported_by_id = NULL WHERE exported_by_id = ?', [id]);

        // 5. Finally delete the user
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        
        await logAction(req.user.id, req.user.name, req.user.role, `Permanently purged user: ${targetUser.name}`);
        res.json({ success: true });
    } catch (err) { 
        console.error('Delete User Error:', err.message);
        res.status(500).json({ error: err.message }); 
    }
};

exports.getAllRoles = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM roles');
        const parsedRows = rows.map(role => {
            let perms = {};
            if (role.permissions) {
                if (typeof role.permissions === 'string') {
                    try {
                        perms = JSON.parse(role.permissions);
                    } catch (e) {
                        perms = {};
                    }
                } else {
                    perms = role.permissions;
                }
            }
            return { ...role, permissions: perms };
        });
        res.json(parsedRows);
    } catch (err) { 
        console.error('Fetch Roles Error:', err);
        res.status(500).json({ error: 'Failed to fetch roles' }); 
    }
};

exports.createRole = async (req, res) => {
    const { name = '', permissions = {}, status = 'Active' } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO roles (name, permissions, status) VALUES (?, ?, ?)', 
            [name, JSON.stringify(permissions), status]
        );
        await logAction(req.user.id, req.user.name, req.user.role, `Created new system role: ${name}`);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateRole = async (req, res) => {
    const { name = '', permissions = {}, status = 'Active' } = req.body;
    const { id } = req.params;
    try {
        // 1. Update the role itself
        await db.execute(
            'UPDATE roles SET name=?, permissions=?, status=? WHERE id=?', 
            [name, JSON.stringify(permissions), status, id]
        );
        
        // 2. Proactively propagate role name change to users table to maintain consistency 
        // for faster lookups and legacy code paths.
        if (name) {
            await db.execute('UPDATE users SET role_name = ? WHERE role_id = ?', [name, id]);
        }

        await logAction(req.user.id, req.user.name, req.user.role, `Configured role policy: ${name}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteRole = async (req, res) => {
    const { id } = req.params;
    try {
        const [[role]] = await db.execute('SELECT name FROM roles WHERE id = ?', [id]);
        if (!role) return res.status(404).json({ error: 'Role not found' });
        
        const roleNameNormalized = role.name.toLowerCase();
        
        // 1. System Protection
        if (id == 1 || roleNameNormalized === 'super admin' || roleNameNormalized === 'admin') {
            return res.status(403).json({ error: 'System Protected: Administrative roles essential for system integrity cannot be deleted.' });
        }

        // 2. Dependency Check (Referential Integrity)
        const [[usageCount]] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role_id = ? OR role_name = ?', [id, role.name]);
        if (usageCount.count > 0) {
            return res.status(400).json({ 
                error: `Integrity Violation: ${usageCount.count} users are currently assigned to this role. Re-assign them before attempting deletion.` 
            });
        }

        await db.execute('DELETE FROM roles WHERE id = ?', [id]);
        await logAction(req.user.id, req.user.name, req.user.role, `Destroyed system role: ${role.name}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
