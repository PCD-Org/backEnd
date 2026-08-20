exports.successResponse = (res, data = {}, pagination = null, statusCode = 200) => {
  const response = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

exports.errorResponse = (res, message = 'An error occurred', errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
