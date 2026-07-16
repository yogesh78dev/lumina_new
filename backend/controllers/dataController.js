
const db = require('../db');
const { logAction } = require('../utils/logger');
const defaultCountries = require('../utils/defaultCountries');
const { PHONE_VALIDATION_MESSAGE, normalizePhoneNumber, isValidPhoneNumber } = require('../utils/phoneValidation');

const normalize = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const buildCountryNameSet = () => {
    const set = new Set();
    try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        for (let i = 65; i <= 90; i++) {
            for (let j = 65; j <= 90; j++) {
                const code = String.fromCharCode(i) + String.fromCharCode(j);
                const name = regionNames.of(code);
                if (name && !/^[A-Z]{2}$/.test(name)) {
                    set.add(normalize(name));
                }
            }
        }
    } catch (e) {
        // Fallback handled by aliases below
    }
    ['UAE', 'USA', 'UK', 'Hong Kong', 'Russia', 'South Korea', 'North Korea', 'Vietnam', 'Venezuela', 'Bolivia', 'Tanzania', 'Unknown'].forEach(alias => {
        set.add(normalize(alias));
    });
    return set;
};

const EMPTY_IMPORT_VALUES = new Set(['', 'unknown', 'unassigned', 'n/a', 'na', 'none', 'null', '-']);

const isEmptyImportValue = (value) => EMPTY_IMPORT_VALUES.has(normalize(value));

let importMasterDataReady = false;
let importMasterDataPromise = null;

const ensureImportMasterData = async () => {
    if (importMasterDataReady) return;
    if (importMasterDataPromise) return importMasterDataPromise;

    importMasterDataPromise = (async () => {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS countries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                iso_code VARCHAR(10) NULL,
                phone_code VARCHAR(20) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS lead_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            )
        `);

        const [leadTypeColumns] = await db.execute('SHOW COLUMNS FROM leads LIKE "lead_type"');
        if (leadTypeColumns.length === 0) {
            await db.execute('ALTER TABLE leads ADD COLUMN lead_type VARCHAR(100) NULL AFTER service');
        }

        const [categoryColumns] = await db.execute('SHOW COLUMNS FROM leads LIKE "lead_category"');
        if (categoryColumns.length === 0) {
            await db.execute('ALTER TABLE leads ADD COLUMN lead_category VARCHAR(100) NULL AFTER service');
        }

        for (const country of defaultCountries) {
            await db.execute(
                'INSERT IGNORE INTO countries (name, iso_code, phone_code) VALUES (?, ?, ?)',
                [country.name, country.isoCode || null, country.phoneCode || null]
            );
        }

        const defaultCategories = ['Domestic Package', 'International Package', 'Study Visa', 'Business Trip', 'Package', 'Passport'];
        for (const name of defaultCategories) {
            await db.execute('INSERT IGNORE INTO lead_categories (name) VALUES (?)', [name]);
        }

        importMasterDataReady = true;
    })();

    try {
        await importMasterDataPromise;
    } finally {
        importMasterDataPromise = null;
    }
};

const parseImportLeadDate = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    const monthMap = {
        jan: '01', january: '01',
        feb: '02', february: '02',
        mar: '03', march: '03',
        apr: '04', april: '04',
        may: '05',
        jun: '06', june: '06',
        jul: '07', july: '07',
        aug: '08', august: '08',
        sep: '09', sept: '09', september: '09',
        oct: '10', october: '10',
        nov: '11', november: '11',
        dec: '12', december: '12'
    };
    const toIsoIfValid = (yyyy, mm, dd) => {
        const iso = `${yyyy}-${mm}-${dd}`;
        const d = new Date(`${iso}T00:00:00`);
        if (!Number.isNaN(d.getTime()) && d.getFullYear() === Number(yyyy) && d.getMonth() + 1 === Number(mm) && d.getDate() === Number(dd)) {
            return iso;
        }
        return 'INVALID';
    };

    // Accept DD-MM-YYYY and DD/MM/YYYY (client formats)
    const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
        const [, ddRaw, mmRaw, yyyy] = dmy;
        const dd = ddRaw.padStart(2, '0');
        const mm = mmRaw.padStart(2, '0');
        return toIsoIfValid(yyyy, mm, dd);
    }

    // Accept DD-MMM-YYYY / DD-Month-YYYY with -, /, or space separators
    const dMonthY = raw.match(/^(\d{1,2})[\s\-/]([A-Za-z]+)[\s\-/](\d{4})$/);
    if (dMonthY) {
        const [, ddRaw, monthRaw, yyyy] = dMonthY;
        const monthKey = monthRaw.toLowerCase();
        const mm = monthMap[monthKey];
        if (!mm) return 'INVALID';
        const dd = ddRaw.padStart(2, '0');
        return toIsoIfValid(yyyy, mm, dd);
    }

    // Backward compatibility: YYYY-MM-DD
    const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
        const [, yyyy, mm, dd] = ymd;
        return toIsoIfValid(yyyy, mm, dd);
    }

    return 'INVALID';
};

exports.getImportHistory = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, file_name as fileName, total_records as totalLeads, 
                   added_by_name as addedBy, created_at as createdAt 
            FROM imported_files 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.importLeads = async (req, res) => {
    const { leads, defaults, fileName } = req.body;
    let connection;
    
    try {
        // DDL and master-data seeding must not run inside the long import transaction.
        await ensureImportMasterData();
        connection = await db.getConnection();
        await connection.beginTransaction();

        let insertedCount = 0;
        const splitPhoneCandidates = (value) => {
            if (!value) return [];
            // Supports: "a,b", "a | b" (+ legacy separators)
            return String(value)
                .split(/[\/,;|]+/)
                .map(v => v.trim())
                .filter(Boolean);
        };

        const [portalUsers] = await connection.execute('SELECT id, name FROM users WHERE status = "Active"');
        const [portalSources] = await connection.execute('SELECT name FROM lead_sources');
        const [portalStatuses] = await connection.execute('SELECT name FROM lead_statuses');
        const [portalTypes] = await connection.execute('SELECT name FROM service_types');
        const [portalCountries] = await connection.execute('SELECT name FROM countries');
        const [portalCategories] = await connection.execute('SELECT name FROM lead_categories');
        const userByName = new Map(portalUsers.map(u => [normalize(u.name), u]));
        const validSourceNames = new Set(portalSources.map(s => normalize(s.name)));
        const validLeadTypeNames = new Set(portalTypes.map(t => normalize(t.name)));
        const categoryByName = new Map(portalCategories.map(c => [normalize(c.name), c.name]));
        const statusByName = new Map(portalStatuses.map(s => [normalize(s.name), s.name]));
        const countryByName = new Map(portalCountries.map(c => [normalize(c.name), c.name]));

        // Validate defaults as fallback values
        if (defaults?.leadSource && !validSourceNames.has(normalize(defaults.leadSource))) {
            await connection.rollback();
            return res.status(400).json({ error: `Invalid default Lead Source: "${defaults.leadSource}". It must match portal Lead Source.` });
        }
        if (defaults?.leadStatus && !statusByName.has(normalize(defaults.leadStatus))) {
            await connection.rollback();
            return res.status(400).json({ error: `Invalid default Lead Status: "${defaults.leadStatus}". It must match portal Lead Status.` });
        }
        if (defaults?.leadCategory && !categoryByName.has(normalize(defaults.leadCategory))) {
            await connection.rollback();
            return res.status(400).json({ error: `Invalid default Lead Category: "${defaults.leadCategory}". It must match portal Lead Category.` });
        }
        if (defaults?.leadType && !validLeadTypeNames.has(normalize(defaults.leadType))) {
            await connection.rollback();
            return res.status(400).json({ error: `Invalid default Lead Type: "${defaults.leadType}". It must match portal Lead Type.` });
        }

        const rowsToInsert = [];
        const validationErrors = [];

        for (let idx = 0; idx < leads.length; idx++) {
            const lead = leads[idx];
            const rowNo = idx + 2; // CSV header is row 1
            const rowErrors = [];

            const rawName = String(lead.name || '').trim();
            const rowLeadSource = String(
                lead['lead source'] ?? lead.leadsource ?? lead.lead_source ?? lead['leadsource'] ?? ''
            ).trim();
            const rowAssignTo = String(
                lead['assign to agent'] ?? lead.assigntoagent ?? lead.assign_to_agent ?? lead['assigned to agent'] ?? ''
            ).trim();
            const rowLeadCategory = String(
                lead['lead category'] ?? lead.leadcategory ?? lead.lead_category ?? lead.category ?? ''
            ).trim();
            const rowLeadStatus = String(
                lead['lead status'] ?? lead.leadstatus ?? lead.lead_status ?? lead.status ?? ''
            ).trim();
            const rowLeadType = String(
                lead['lead type'] ?? lead.leadtype ?? lead.lead_type ?? ''
            ).trim();
            const rowService = String(lead.service ?? '').trim();
            const rowRemark = String(
                lead['notes/remark'] ??
                lead['notes'] ??
                lead['remark'] ??
                lead['remarks'] ??
                ''
            ).trim();

            if (!rawName) {
                rowErrors.push('Name is required');
            }

            // Merge and normalize phone values from all potential columns.
            // If `phone` contains multiple numbers, map them across phone1..phone4.
            const phoneParts = [
                ...splitPhoneCandidates(lead.phone ?? lead['phone number'] ?? lead.mobile ?? lead['mobile number']),
                ...splitPhoneCandidates(lead.phone2 ?? lead['phone 2'] ?? lead['phone number 2']),
                ...splitPhoneCandidates(lead.phone3 ?? lead['phone 3'] ?? lead['phone number 3']),
                ...splitPhoneCandidates(lead.phone4 ?? lead['phone 4'] ?? lead['phone number 4'])
            ];

            const normalizedPhones = [];
            const invalidPhones = [];
            for (const part of phoneParts) {
                if (!isValidPhoneNumber(part)) {
                    invalidPhones.push(part);
                    continue;
                }
                const normalized = normalizePhoneNumber(part);
                if (normalized && !normalizedPhones.includes(normalized)) {
                    normalizedPhones.push(normalized);
                }
            }

            const phone = normalizedPhones[0] || null;
            const phone2 = normalizedPhones[1] || null;
            const phone3 = normalizedPhones[2] || null;
            const phone4 = normalizedPhones[3] || null;
            if (!phone) {
                rowErrors.push('Phone is required');
            }
            if (invalidPhones.length > 0) {
                rowErrors.push(`Invalid Phone "${invalidPhones.join(', ')}" (${PHONE_VALIDATION_MESSAGE})`);
            }

            // Country validation (no random text)
            const rawCountry = String(lead.country || '').trim();
            const countryNormalized = normalize(rawCountry);
            let finalCountry = rawCountry || defaults.country || 'India';
            if (rawCountry) {
                const matchedCountry = countryByName.get(countryNormalized);
                if (!matchedCountry) {
                    rowErrors.push(`Invalid Country "${rawCountry}" (must match portal Country)`);
                } else {
                    finalCountry = matchedCountry;
                }
            } else if (defaults?.country) {
                finalCountry = countryByName.get(normalize(defaults.country)) || defaults.country;
            } else {
                finalCountry = countryByName.get(normalize('India')) || 'India';
            }

            // Assign To Agent validation by portal user name
            let assignedToId = defaults?.assignedToId || null;
            if (rowAssignTo && !isEmptyImportValue(rowAssignTo)) {
                const matchedUser = userByName.get(normalize(rowAssignTo));
                if (!matchedUser) {
                    rowErrors.push(`Invalid Assign To Agent "${rowAssignTo}" (must match portal user name)`);
                } else {
                    assignedToId = matchedUser.id;
                }
            }

            // Lead Source validation by portal lead source name
            let finalLeadSource = defaults?.leadSource || 'Import';
            if (rowLeadSource) {
                if (!validSourceNames.has(normalize(rowLeadSource))) {
                    rowErrors.push(`Invalid Lead Source "${rowLeadSource}" (must match portal Lead Source)`);
                } else {
                    finalLeadSource = rowLeadSource;
                }
            }

            let finalLeadCategory = defaults?.leadCategory
                ? categoryByName.get(normalize(defaults.leadCategory)) || defaults.leadCategory
                : null;
            if (rowLeadCategory) {
                const matchedCategory = categoryByName.get(normalize(rowLeadCategory));
                if (!matchedCategory) {
                    rowErrors.push(`Invalid Lead Category "${rowLeadCategory}" (must match portal Lead Category)`);
                } else {
                    finalLeadCategory = matchedCategory;
                }
            }

            let finalLeadStatus = defaults?.leadStatus
                ? statusByName.get(normalize(defaults.leadStatus)) || defaults.leadStatus
                : (statusByName.get(normalize('New Lead')) || 'New Lead');
            if (rowLeadStatus) {
                const matchedStatus = statusByName.get(normalize(rowLeadStatus));
                if (!matchedStatus) {
                    rowErrors.push(`Invalid Lead Status "${rowLeadStatus}" (must match portal Lead Status)`);
                } else {
                    finalLeadStatus = matchedStatus;
                }
            }

            let finalLeadType = defaults?.leadType || null;
            if (rowLeadType) {
                if (!validLeadTypeNames.has(normalize(rowLeadType))) {
                    rowErrors.push(`Invalid Lead Type "${rowLeadType}" (must match portal Lead Type)`);
                } else {
                    finalLeadType = rowLeadType;
                }
            }

            // Handle date from multiple possible header variants
            const createdAtInput = (
                lead.createdAt ||
                lead.createdat ||
                lead.created_at ||
                lead.leadDate ||
                lead.leaddate ||
                lead.lead_date ||
                lead['lead date'] ||
                lead.Date ||
                lead.date ||
                null
            );
            const createdAt = parseImportLeadDate(createdAtInput);
            if (createdAt === 'INVALID') {
                rowErrors.push(`Invalid Date "${createdAtInput}" (use DD-MM-YYYY, DD/MM/YYYY, or DD-MMM-YYYY, e.g. 01-06-2026 or 1/May/2026)`);
            }

            if (rowErrors.length > 0) {
                validationErrors.push(`Row ${rowNo}: ${rowErrors.join('; ')}`);
                continue;
            }

            rowsToInsert.push({
                name: rawName,
                phone,
                phone2,
                phone3,
                phone4,
                email: lead.email || null,
                service: rowService || defaults.service || null,
                leadType: finalLeadType,
                leadCategory: finalLeadCategory,
                country: finalCountry,
                leadSource: finalLeadSource,
                leadStatus: finalLeadStatus,
                assignedToId,
                createdAt,
                rowRemark
            });
        }

        if (validationErrors.length > 0) {
            const MAX_ERRORS_TO_RETURN = 100;
            const visibleErrors = validationErrors.slice(0, MAX_ERRORS_TO_RETURN);
            await connection.rollback();
            return res.status(400).json({
                error: `Import validation failed. ${validationErrors.length} row(s) contain errors.${validationErrors.length > MAX_ERRORS_TO_RETURN ? ` Showing first ${MAX_ERRORS_TO_RETURN} errors.` : ''}\n${visibleErrors.join('\n')}`
            });
        }

        for (const row of rowsToInsert) {
            const [result] = await connection.execute(
                `INSERT INTO leads (name, phone, phone2, phone3, phone4, email, service, lead_type, lead_category, country, lead_source, lead_status, assigned_to_id, created_at, last_activity_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
                [
                    row.name,
                    row.phone,
                    row.phone2,
                    row.phone3,
                    row.phone4,
                    row.email,
                    row.service,
                    row.leadType,
                    row.leadCategory,
                    row.country,
                    row.leadSource,
                    row.leadStatus,
                    row.assignedToId || null,
                    row.createdAt,
                    row.createdAt
                ]
            );

            // Add row remark/default note
            const defaultNote = String(defaults.note || '').trim();
            const rowNote = String(row.rowRemark || '').trim();
            const noteToInsert = rowNote && defaultNote
                ? `${defaultNote}\n${rowNote}`
                : (rowNote || defaultNote);

            if (noteToInsert) {
                await connection.execute(
                    'INSERT INTO lead_notes (lead_id, content, author_name) VALUES (?, ?, ?)',
                    [result.insertId, noteToInsert, req.user.name]
                );
            }
            insertedCount++;
        }

        // Log the file import history
        await connection.execute(
            'INSERT INTO imported_files (file_name, total_records, module, added_by_id, added_by_name) VALUES (?, ?, "Lead", ?, ?)',
            [fileName, insertedCount, req.user.id, req.user.name]
        );

        await logAction(req.user.id, req.user.name, req.user.role, `Imported ${insertedCount} leads from file: ${fileName}`);
        
        await connection.commit();
        res.json({ success: true, count: insertedCount });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Import failed:', err);
        res.status(500).json({ error: 'Data import failed: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteImportRecord = async (req, res) => {
    try {
        await db.execute('DELETE FROM imported_files WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logExport = async (req, res) => {
    const { module, count } = req.body;
    try {
        await db.execute(
            'INSERT INTO export_requests (module, exported_by_id, record_count, status) VALUES (?, ?, ?, "Completed")',
            [module, req.user.id, count]
        );
        await logAction(req.user.id, req.user.name, req.user.role, `Exported ${count} records from module: ${module}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
