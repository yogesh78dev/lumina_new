
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const customerRoutes = require('./routes/customerRoutes');
const userRoutes = require('./routes/userRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const chatRoutes = require('./routes/chatRoutes');
const masterRoutes = require('./routes/masterRoutes');
const configRoutes = require('./routes/configRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const targetRoutes = require('./routes/targetRoutes');
const logRoutes = require('./routes/logRoutes');
const commRoutes = require('./routes/communicationRoutes');
const callController = require('./controllers/callController');
const configController = require('./controllers/configController');
const notificationRoutes = require('./routes/notificationRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const dataRoutes = require('./routes/dataRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Security Headers
app.use(helmet());

// Rate Limiting (Prevent Brute Force on Auth)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login requests per window
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
});

// General Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 Lumina CRM Backend is running',
        time: new Date()
    });
});

// API Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is working ✅'
    });
})

// Routing Layer
app.use('/api/auth', authLimiter, authRoutes);

// Public Config (for Login/Forgot Password pages)
app.get('/api/public/config', configController.getPublicConfig);

// Public Voice Webhooks (Twilio)
app.post('/api/public/voice/twiml', callController.generateTwiML);
app.post('/api/public/voice/status', callController.handleVoiceStatus);

// Protected API Routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/leads', authMiddleware, leadRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/master', authMiddleware, masterRoutes);
app.use('/api/config', authMiddleware, configRoutes);
app.use('/api/quotes', authMiddleware, quoteRoutes);
app.use('/api/targets', authMiddleware, targetRoutes);
app.use('/api/logs', authMiddleware, logRoutes);
app.use('/api/communications', authMiddleware, commRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/vendors', authMiddleware, vendorRoutes);
app.use('/api/data', authMiddleware, dataRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Internal Server Exception' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`---------------------------------------------------`);
    console.log(`🚀 Lumina CRM Secure Server Live at port: ${PORT}`);
    console.log(`---------------------------------------------------`);
});
