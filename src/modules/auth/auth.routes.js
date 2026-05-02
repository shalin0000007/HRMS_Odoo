const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const { login, getMe, changePassword } = require('./auth.controller');

// POST /api/auth/login        — public
router.post('/login', login);

// GET  /api/auth/me           — authenticated
router.get('/me', auth, getMe);

// POST /api/auth/change-password — authenticated
router.post('/change-password', auth, changePassword);

module.exports = router;
