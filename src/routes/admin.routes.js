// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllProperties,
  getAllUsers
} = require('../controllers/admin.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

router.use(authenticate, isAdmin);

router.get('/stats', getDashboardStats);
router.get('/properties', getAllProperties);
router.get('/users', getAllUsers);

module.exports = router;