/**
 * Middleware to parse stringified JSON fields in multipart/form-data requests.
 * This ensures compatibility with the existing Joi validation schemas that expect nested objects.
 */
const parseMultipart = (req, res, next) => {
  if (req.is('multipart/form-data') && req.body) {
    // Parse nested object fields that arrive as JSON strings from frontend formData
    const fieldsToParse = ['title', 'description'];
    
    fieldsToParse.forEach((field) => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
          // Ignore parsing errors, let Joi validation handle the invalid format later
        }
      }
    });

    // Handle explicit null for coverImage deletion if sent as a string by formData
    if (req.body.coverImage === 'null') {
      req.body.coverImage = null;
    }
  }
  
  next();
};

module.exports = parseMultipart;
