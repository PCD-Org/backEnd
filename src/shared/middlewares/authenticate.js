const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../errors/AppError');
const adminRepository = require('../../modules/admins/admin.repository');

const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies.accessToken;

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Check if admin still exists and is active
    const currentAdmin = await adminRepository.findById(decoded.id);
    if (!currentAdmin) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentAdmin.isActive) {
      return next(new AppError('Your account has been deactivated.', 401));
    }

    // 4. Attach admin to request
    req.admin = currentAdmin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(err);
  }
};

module.exports = authenticate;
