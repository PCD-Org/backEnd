const AppError = require('../errors/AppError');

const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      const appError = new AppError('Validation failed.', 400);
      appError.validationErrors = validationErrors;
      return next(appError);
    }

    // Replace request data with validated data (which strips unknowns)
    req[source] = value;
    next();
  };
};

module.exports = validateRequest;
