
const db = require('../db');

let sidebarOrderColumnReady = false;

const ensureSidebarOrderColumn = async () => {
    if (sidebarOrderColumnReady) return;
    const [columns] = await db.execute('SHOW COLUMNS FROM company_details LIKE "sidebar_order"');
    if (columns.length === 0) {
        await db.execute('ALTER TABLE company_details ADD COLUMN sidebar_order TEXT NULL');
    }
    sidebarOrderColumnReady = true;
};

const parseSidebarOrder = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
};

/**
 * Application Handshake: Fetches all core configurations, master data, 
 * users, and roles to initialize the frontend global context state.
 */
exports.getHandshake = async (req, res) => {
    try {
        await ensureSidebarOrderColumn();
        const queries = [
            'SELECT * FROM lead_sources',
            'SELECT * FROM lead_statuses',
            'SELECT * FROM application_statuses',
            'SELECT * FROM passport_statuses',
            'SELECT * FROM document_types',
            'SELECT * FROM remark_statuses',
            'SELECT * FROM service_types',
            'SELECT * FROM lost_reasons',
            'SELECT * FROM sale_by',
            'SELECT * FROM worked_by',
            'SELECT id, name, username, email, role_id as roleId, role_name as role, status, image_url as imageUrl FROM users',
            'SELECT * FROM roles',
            'SELECT * FROM vendors',
            'SELECT id, company_name as companyName, address, city, state, country, pincode, from_name as fromName, from_email as fromEmail, reply_name as replyName, reply_email as replyEmail, help_email as helpEmail, info_email as infoEmail, phone, secondary_phone as secondaryPhone, instagram_link as instagramLink, facebook_link as facebookLink, twitter_link as twitterLink, linkedin_link as linkedinLink, website, gst_no as gstNo, timezone, date_format as dateFormat, currency, logo_url as logoUrl, favicon_url as faviconUrl, sidebar_order as sidebarOrder FROM company_details WHERE id = 1',
            'SELECT id, api_name as apiName, api_url as apiUrl, api_key as apiKey FROM email_api_credentials WHERE id = 1',
            'SELECT id, api_name as apiName, from_number as fromNumber, sid, token FROM mobile_api_credentials WHERE id = 1',
            'SELECT id, gateway_name as gatewayName, api_key as apiKey, api_secret as apiSecret FROM payment_gateway_settings WHERE id = 1',
            'SELECT * FROM permission_categories ORDER BY id ASC',
            'SELECT * FROM permission_sections ORDER BY id ASC',
            'SELECT * FROM workflow_rules ORDER BY created_at DESC',
            'SELECT id, subject, content, recipients, scheduled_at as scheduledAt, author_id as authorId, created_at as createdAt FROM announcements ORDER BY scheduled_at DESC'
        ];

        const results = await Promise.all(queries.map(q => db.execute(q)));

        // Senior Implementation: Parse JSON strings
        const roles = results[11][0].map(role => {
            let perms = {};
            if (role.permissions) {
                if (typeof role.permissions === 'string') {
                    try { perms = JSON.parse(role.permissions); } catch (e) { perms = {}; }
                } else { perms = role.permissions; }
            }
            return { ...role, permissions: perms };
        });

        const workflows = results[19][0].map(rule => ({
            ...rule,
            conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions,
            actionDetails: typeof rule.action_details === 'string' ? JSON.parse(rule.action_details) : rule.action_details,
            actionType: rule.action_type,
            triggerModule: rule.trigger_module,
            triggerEvent: rule.trigger_event
        }));

        const announcements = results[20][0].map(ann => ({
            ...ann,
            recipients: typeof ann.recipients === 'string' ? JSON.parse(ann.recipients) : ann.recipients
        }));

        const companyDetails = results[13][0][0] || {};
        companyDetails.sidebarOrder = parseSidebarOrder(companyDetails.sidebarOrder);

        res.json({
            leadSources: results[0][0],
            leadStatuses: results[1][0],
            applicationStatuses: results[2][0],
            passportStatuses: results[3][0],
            documentTypes: results[4][0],
            remarkStatuses: results[5][0],
            serviceTypes: results[6][0],
            lostReasons: results[7][0],
            saleBy: results[8][0],
            workedBy: results[9][0],
            users: results[10][0],
            roles: roles,
            vendors: results[12][0],
            companyDetails,
            emailApiCredentials: results[14][0][0] || {},
            mobileApiCredentials: results[15][0][0] || {},
            paymentGatewaySettings: results[16][0][0] || {},
            permissionCategories: results[17][0],
            permissionSections: results[18][0],
            workflowRules: workflows,
            announcements: announcements
        });
    } catch (err) { 
        console.error('Handshake fetch failed:', err);
        res.status(500).json({ error: err.message }); 
    }
};

/**
 * Fetches basic company public information (Logo, Name, Favicon)
 * Accessible without authentication for login/forgot password pages.
 */
exports.getPublicConfig = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT company_name as companyName, logo_url as logoUrl, favicon_url as faviconUrl FROM company_details WHERE id = 1');
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update global company profile
 */
exports.updateCompany = async (req, res) => {
    const c = req.body;
    const sidebarOrderJson = Array.isArray(c.sidebarOrder) ? JSON.stringify(c.sidebarOrder) : null;
    const sql = `UPDATE company_details SET 
        company_name=?, address=?, city=?, state=?, country=?, pincode=?, 
        from_name=?, from_email=?, reply_name=?, reply_email=?, help_email=?, info_email=?, 
        phone=?, secondary_phone=?, instagram_link=?, facebook_link=?, twitter_link=?, linkedin_link=?, 
        website=?, gst_no=?, timezone=?, date_format=?, currency=?,
        logo_url=?, favicon_url=?, sidebar_order=COALESCE(?, sidebar_order)
        WHERE id=1`;
    try {
        await ensureSidebarOrderColumn();
        if (Object.prototype.hasOwnProperty.call(c, 'sidebarOrder') && req.user?.role !== 'Super Admin') {
            return res.status(403).json({ error: 'Only Super Admin can manage sidebar order.' });
        }
        await db.execute(sql, [
            c.companyName, c.address, c.city, c.state, c.country, c.pincode, 
            c.fromName, c.fromEmail, c.replyName, c.replyEmail, c.helpEmail, c.infoEmail, 
            c.phone, c.secondaryPhone, c.instagramLink, c.facebookLink, c.twitterLink, c.linkedinLink, 
            c.website, c.gstNo, c.timezone, c.dateFormat, c.currency,
            c.logoUrl, c.faviconUrl, sidebarOrderJson
        ]);
        res.json({ success: true });
    } catch (err) { 
        console.error('Failed to update company details:', err);
        res.status(500).json({ error: err.message }); 
    }
};

/**
 * Update Email API Credentials
 */
exports.updateEmailCredentials = async (req, res) => {
    const { apiName, apiUrl, apiKey } = req.body;
    const sql = `UPDATE email_api_credentials SET api_name=?, api_url=?, api_key=? WHERE id=1`;
    try {
        await db.execute(sql, [apiName, apiUrl, apiKey]);
        res.json({ success: true });
    } catch (err) { 
        console.error('Failed to update email credentials:', err);
        res.status(500).json({ error: err.message }); 
    }
};

/**
 * Update Mobile API Credentials
 */
exports.updateMobileCredentials = async (req, res) => {
    const { apiName, fromNumber, sid, token } = req.body;
    const sql = `UPDATE mobile_api_credentials SET api_name=?, from_number=?, sid=?, token=? WHERE id=1`;
    try {
        await db.execute(sql, [apiName, fromNumber, sid, token]);
        res.json({ success: true });
    } catch (err) { 
        console.error('Failed to update mobile credentials:', err);
        res.status(500).json({ error: err.message }); 
    }
};
