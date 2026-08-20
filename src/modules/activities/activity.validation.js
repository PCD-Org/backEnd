const Joi = require('joi');

const allowedCategories = ['relief', 'psychosocial', 'workshops', 'development'];

const bilingualStringRequired = Joi.object({
  en: Joi.string().trim().max(1000).required(),
  ar: Joi.string().trim().max(1000).required(),
});

const createActivitySchema = Joi.object({
  title: bilingualStringRequired.required(),
  description: bilingualStringRequired.required(),
  date: Joi.date().iso().required(),
  category: Joi.string().valid(...allowedCategories).required(),
  coverImage: Joi.object({
    url: Joi.string().uri().optional(),
    publicId: Joi.string().optional(),
  }).min(1).optional().allow(null),
});

const updateActivitySchema = Joi.object({
  title: bilingualStringRequired.optional(),
  description: bilingualStringRequired.optional(),
  date: Joi.date().iso().optional(),
  category: Joi.string().valid(...allowedCategories).optional(),
  coverImage: Joi.object({
    url: Joi.string().uri().optional(),
    publicId: Joi.string().optional(),
  }).min(1).optional().allow(null),
}).min(1);

const listActivitiesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().valid(...allowedCategories).optional(),
  sort: Joi.string().valid('asc', 'desc').optional(),
});

const activityIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

module.exports = {
  createActivitySchema,
  updateActivitySchema,
  listActivitiesQuerySchema,
  activityIdParamSchema,
};
