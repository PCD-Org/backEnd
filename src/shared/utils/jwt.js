const jwt = require('jsonwebtoken');
const config = require('../../config/env');

/**
 * Generate an Access Token
 * @param {Object} payload 
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};


/**
 * Verify an Access Token
 * @param {string} token 
 * @returns {Object}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};


module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
