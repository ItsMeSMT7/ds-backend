// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { signup, login, logout, getProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);

module.exports = router;