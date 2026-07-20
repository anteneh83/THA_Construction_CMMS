const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./src/config/db');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const carRoutes = require('./src/routes/carRoutes');
const issueReportRoutes = require('./src/routes/issueReportRoutes');
const issueCaseRoutes = require('./src/routes/issueCaseRoutes');
const sparePartRequestRoutes = require('./src/routes/sparePartRequestRoutes');
const purchaseRecordRoutes = require('./src/routes/purchaseRecordRoutes');
const receivedVerificationRoutes = require('./src/routes/receivedVerificationRoutes');
const handoverValidationRoutes = require('./src/routes/handoverValidationRoutes');
const finalVerificationRoutes = require('./src/routes/finalVerificationRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', // Admin
    'http://localhost:3001', // Driver
    'http://localhost:3002', // Site Manager
    'http://localhost:3003', // Accountant
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/issue-reports', issueReportRoutes);
app.use('/api/issue-cases', issueCaseRoutes);
app.use('/api/spare-part-requests', sparePartRequestRoutes);
app.use('/api/purchase-records', purchaseRecordRoutes);
app.use('/api/received-verifications', receivedVerificationRoutes);
app.use('/api/handover-validations', handoverValidationRoutes);
app.use('/api/final-verifications', finalVerificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚧 CMMS Backend Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1 || 5001;

    console.error(`\nPort ${PORT} is already in use.`);
    console.error('Stop the process using that port, or start this backend with a different port:');
    console.error(`  PORT=${nextPort} npm run dev\n`);
    process.exit(1);
  }

  console.error(err);
  process.exit(1);
});

module.exports = app;
