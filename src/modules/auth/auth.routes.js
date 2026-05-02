const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const { login, register, verifyEmail, resendVerification, getMe, changePassword } = require('./auth.controller');

// POST /api/auth/register        — public
router.post('/register', register);

// GET  /api/auth/verify-email    — public
router.get('/verify-email', verifyEmail);

// POST /api/auth/resend-verification — public
router.post('/resend-verification', resendVerification);

// POST /api/auth/login           — public
router.post('/login', login);

// GET  /api/auth/me              — authenticated
router.get('/me', auth, getMe);

// POST /api/auth/change-password — authenticated
router.post('/change-password', auth, changePassword);

module.exports = router;
