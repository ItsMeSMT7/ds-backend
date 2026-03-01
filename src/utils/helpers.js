// backend/src/utils/helpers.js
const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const formatProperty = (property) => {
  return {
    ...property,
    media: property.media?.map(m => ({
      id: m.id,
      url: m.mediaUrl,
      type: m.mediaType
    })) || []
  };
};

module.exports = { generateToken, formatProperty };