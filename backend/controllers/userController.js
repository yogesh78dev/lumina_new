
const db = require('../db');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/logger');

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, username, email, role_id as roleId, role_name as role, status, image_url FROM users');
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
    try {
        const [[user]] = await db.execute('SELECT name FROM users WHERE id = ?', [req.params.id]);
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (user) {
            await logAction(req.user.id, req.user.name, req.user.role, `Deleted user: ${user.name}`);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
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
        await logAction(req.user.id, req.user.name, req.user.role, `Created new role: ${name}`);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateRole = async (req, res) => {
    const { name = '', permissions = {}, status = 'Active' } = req.body;
    try {
        await db.execute(
            'UPDATE roles SET name=?, permissions=?, status=? WHERE id=?', 
            [name, JSON.stringify(permissions), status, req.params.id]
        );
        await logAction(req.user.id, req.user.name, req.user.role, `Updated role policy: ${name}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteRole = async (req, res) => {
    try {
        const [[role]] = await db.execute('SELECT name FROM roles WHERE id = ?', [req.params.id]);
        if (!role) return res.status(404).json({ error: 'Role not found' });
        
        if (req.params.id == 1 || role.name.toLowerCase() === 'super admin') {
            return res.status(403).json({ error: 'System Protected: Super Admin role cannot be deleted.' });
        }

        await db.execute('DELETE FROM roles WHERE id = ?', [req.params.id]);
        await logAction(req.user.id, req.user.name, req.user.role, `Permanently deleted role: ${role.name}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
