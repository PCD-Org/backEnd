const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password.
 * @param {string} password 
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hash.
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
