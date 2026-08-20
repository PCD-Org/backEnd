const AppError = require('../errors/AppError');

const authorize = (...roles) => {
  return (req, res, next) => {
    // req.admin should be populated by authenticate middleware
    if (!roles.includes(req.admin.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = authorize;
