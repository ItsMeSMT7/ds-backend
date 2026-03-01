// backend/src/routes/property.routes.js
const express = require('express');
const router = express.Router();
const {
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  deleteMedia,
  toggleBookmark,
  getBookmarks
} = require('../controllers/property.controller');
const { authenticate, isAdmin, optionalAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/', getProperties);
router.get('/featured', getFeaturedProperties);
router.get('/:id', getPropertyById);

// Authenticated routes
router.post('/:propertyId/bookmark', authenticate, toggleBookmark);
router.get('/user/bookmarks', authenticate, getBookmarks);

// Admin routes
router.post('/', authenticate, isAdmin, upload.array('media', 10), createProperty);
router.put('/:id', authenticate, isAdmin, upload.array('media', 10), updateProperty);
router.delete('/:id', authenticate, isAdmin, deleteProperty);
router.delete('/media/:mediaId', authenticate, isAdmin, deleteMedia);

module.exports = router;