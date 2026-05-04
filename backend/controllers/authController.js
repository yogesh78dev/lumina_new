
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    // console.log("rows==>",email);
    try {
        const [rows] = await db.execute(
            'SELECT u.*, r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE (u.email = ? OR u.username = ?) AND u.status = "Active"',
            [email, email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password).catch(() => false);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // --- Senior Level Implementation: Record Access Log ---
        // Capture IP and Device Info for security audit
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';
        
        // Non-blocking log insertion
        db.execute(
            'INSERT INTO user_activity_logs (user_id, ip_address, user_agent, status, location) VALUES (?, ?, ?, "Logged In", "Web Application")',
            [user.id, ip, userAgent]
        ).catch(e => console.error('Access log failed:', e));

        const token = jwt.sign(
            { id: user.id, role: user.role_name, email: user.email, name: user.name },
            process.env.JWT_SECRET || 'lumina_secret_key_2025',
            { expiresIn: '8h' }
        );

        const userResponse = { ...user, role: user.role_name, roleId: user.role_id };
        delete userResponse.password;
        delete userResponse.role_name;
        delete userResponse.role_id;

        if (typeof userResponse.permissions === 'string') {
            try { userResponse.permissions = JSON.parse(userResponse.permissions); } catch (e) { userResponse.permissions = {}; }
        }

        res.json({ success: true, token, user: userResponse });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during authentication.' });
    }
};

exports.me = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT u.id, u.name, u.username, u.email, u.role_id, u.role_name, u.status, u.image_url, r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const user = rows[0];
        const userResponse = { ...user, role: user.role_name, roleId: user.role_id };
        delete userResponse.role_name;
        delete userResponse.role_id;

        if (typeof userResponse.permissions === 'string') {
            try { userResponse.permissions = JSON.parse(userResponse.permissions); } catch (e) { userResponse.permissions = {}; }
        }

        res.json(userResponse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
