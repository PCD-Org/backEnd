const Joi = require('joi');

const createAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('editor', 'superadmin').optional(),
});

const updateAdminSchema = Joi.object({
  role: Joi.string().valid('editor', 'superadmin').optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createAdminSchema,
  updateAdminSchema,
};
