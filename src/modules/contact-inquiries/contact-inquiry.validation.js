const Joi = require('joi');

const createContactInquirySchema = Joi.object({
  name: Joi.string().trim().max(200).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
    'string.max': 'Name cannot exceed 200 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().trim().email().max(254).required().messages({
    'string.base': 'Email must be a string',
    'string.empty': 'Email cannot be empty',
    'string.email': 'Email must be a valid email address',
    'string.max': 'Email cannot exceed 254 characters',
    'any.required': 'Email is required'
  }),
  message: Joi.string().trim().max(5000).required().messages({
    'string.base': 'Message must be a string',
    'string.empty': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 5000 characters',
    'any.required': 'Message is required'
  })
}).options({ abortEarly: false, stripUnknown: true });

const updateContactInquiryStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'read', 'replied').required().messages({
    'any.only': 'Status must be one of: new, read, replied',
    'any.required': 'Status is required'
  })
}).options({ abortEarly: false, stripUnknown: true });

const listContactInquiriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('new', 'read', 'replied'),
  sort: Joi.string().valid('asc', 'desc').default('desc')
}).options({ abortEarly: false, stripUnknown: true });

const contactInquiryIdSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid ObjectId format',
    'any.required': 'ID is required'
  })
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createContactInquirySchema,
  updateContactInquiryStatusSchema,
  listContactInquiriesSchema,
  contactInquiryIdSchema
};
