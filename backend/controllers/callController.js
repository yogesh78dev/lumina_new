
const db = require('../db');
const { logAction } = require('../utils/logger');
const twilio = require('twilio');

// Initialize table
const initTable = async () => {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS call_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lead_id INT NOT NULL,
                user_id INT NOT NULL,
                call_sid VARCHAR(255),
                status ENUM('initiated', 'ringing', 'connected', 'failed', 'completed', 'no-answer', 'busy', 'canceled') DEFAULT 'initiated',
                direction ENUM('outbound', 'inbound') DEFAULT 'outbound',
                duration INT DEFAULT 0,
                recording_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await db.query(sql);
    } catch (err) {
        console.error('Error creating call_logs table:', err.message);
    }
};

initTable();

exports.initiateCall = async (req, res) => {
    const { leadId, phoneNumber } = req.body;
    const userId = req.user.id;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        const [[creds]] = await db.execute('SELECT * FROM mobile_api_credentials WHERE id = 1');
        
        let callSid = 'MOCK_' + Math.random().toString(36).substring(7);
        let status = 'initiated';

        // Check if Twilio is configured
        const isTwilioConfigured = creds && creds.sid && creds.sid !== 'AC_default_sid' && process.env.TWILIO_AUTH_TOKEN;

        if (isTwilioConfigured) {
            try {
                const client = twilio(creds.sid, process.env.TWILIO_AUTH_TOKEN);
                // For a real click-to-call, we'd use a bridge or Twilio Client.
                // Here we'll initiate a simple outbound call to the lead.
                const call = await client.calls.create({
                    url: `${process.env.APP_URL || 'http://localhost:3000'}/api/communications/voice/twiml`,
                    to: phoneNumber,
                    from: creds.from_number,
                    statusCallback: `${process.env.APP_URL || 'http://localhost:3000'}/api/communications/voice/status`,
                    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                });
                callSid = call.sid;
                status = call.status;
            } catch (twilioErr) {
                console.error('Twilio Call Error:', twilioErr.message);
                status = 'failed';
            }
        }

        const [result] = await db.execute(
            'INSERT INTO call_logs (lead_id, user_id, call_sid, status, direction) VALUES (?, ?, ?, ?, ?)',
            [leadId, userId, callSid, status, 'outbound']
        );

        await logAction(userId, req.user.name, req.user.role, `Initiated a call to lead ID: ${leadId} (${phoneNumber})`);

        res.json({ 
            success: true, 
            callId: result.insertId, 
            callSid, 
            status, 
            isMock: !isTwilioConfigured,
            message: !isTwilioConfigured ? 'Twilio not configured. Running in simulation mode.' : 'Call initiated via Twilio.'
        });
    } catch (err) {
        console.error('Call Initiation Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getCallLogs = async (req, res) => {
    const { leadId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT c.*, u.name as userName 
             FROM call_logs c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.lead_id = ? 
             ORDER BY c.created_at DESC`,
            [leadId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.handleVoiceStatus = async (req, res) => {
    const { CallSid, CallStatus, CallDuration } = req.body;
    try {
        await db.execute(
            'UPDATE call_logs SET status = ?, duration = ? WHERE call_sid = ?',
            [CallStatus, CallDuration || 0, CallSid]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error('Voice Status Update Error:', err.message);
        res.sendStatus(500);
    }
};

exports.generateTwiML = (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say('Connecting your call from Lumina CRM. Please wait.');
    res.type('text/xml');
    res.send(response.toString());
};

exports.updateMockStatus = async (req, res) => {
    const { callSid, status, duration } = req.body;
    try {
        await db.execute(
            'UPDATE call_logs SET status = ?, duration = ? WHERE call_sid = ?',
            [status, duration || 0, callSid]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
