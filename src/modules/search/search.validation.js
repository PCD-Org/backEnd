const Joi = require('joi');

const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(2).max(100).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = {
  searchQuerySchema,
};
