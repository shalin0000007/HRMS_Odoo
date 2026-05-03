/**
 * EmPay HRMS — Express App Entry Point
 * Engineer A — Backend
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes       = require('./modules/auth/auth.routes');
const employeeRoutes   = require('./modules/employees/employee.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const leaveRoutes      = require('./modules/leaves/leave.routes');
const payrollRoutes    = require('./modules/payroll/payroll.routes');
const analyticsRoutes  = require('./modules/analytics/analytics.routes');
const errorHandler     = require('./middleware/errorHandler');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000'
    ];

    // Check if origin matches allowed list or is a Vercel deployment
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── BODY PARSING ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── STATIC FILES — Profile picture uploads ────────────────────────
// Avatars saved by multer are served here:
//   GET http://localhost:5000/uploads/avatars/<uuid>.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// ── HEALTH CHECK ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'EmPay HRMS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── ROUTES ────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/employees',  employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves',     leaveRoutes);
app.use('/api/payroll',    payrollRoutes);
app.use('/api/analytics',  analyticsRoutes);

// ── 404 HANDLER ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────
app.use(errorHandler);

// ── START SERVER ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 EmPay Backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS allowed: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
