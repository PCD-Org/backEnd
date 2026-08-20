const Joi = require('joi');

const createImpactStatisticSchema = Joi.object({
  label: Joi.object({
    en: Joi.string().trim().max(1000).required(),
    ar: Joi.string().trim().max(1000).required(),
  }).required(),
  value: Joi.number().min(0).required(),
}).options({ abortEarly: false, stripUnknown: true });

const updateImpactStatisticSchema = Joi.object({
  label: Joi.object({
    en: Joi.string().trim().max(1000).required(),
    ar: Joi.string().trim().max(1000).required(),
  }),
  value: Joi.number().min(0),
})
  .min(1)
  .options({ abortEarly: false, stripUnknown: true });

const impactStatisticIdParamSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createImpactStatisticSchema,
  updateImpactStatisticSchema,
  impactStatisticIdParamSchema,
};
