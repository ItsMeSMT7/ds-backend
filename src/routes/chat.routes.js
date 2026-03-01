// backend/src/routes/chat.routes.js
const express = require('express');
const router = express.Router();
const {
  getChatHistory,
  getConversations,
  sendMessage,
  getAdminUser
} = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/admin-user', authenticate, getAdminUser);
router.get('/conversations', authenticate, getConversations);
router.get('/history/:userId', authenticate, getChatHistory);
router.post('/send', authenticate, sendMessage);

module.exports = router;