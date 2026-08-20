const express = require('express');
const rateLimit = require('express-rate-limit');
const contactInquiryController = require('./contact-inquiry.controller');
const {
  createContactInquirySchema,
  updateContactInquiryStatusSchema,
  listContactInquiriesSchema,
  contactInquiryIdSchema,
} = require('./contact-inquiry.validation');
const validateRequest = require('../../shared/middlewares/validate-request');
const authenticate = require('../../shared/middlewares/authenticate');
const authorize = require('../../shared/middlewares/authorize');

const router = express.Router();

// Rate limiter for public endpoint to prevent spam (5 requests per hour per IP)
const publicInquiryRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-ip']) {
      return req.headers['x-test-ip'];
    }
    return require('express-rate-limit').ipKeyGenerator(req, res);
  },
  message: {
    success: false,
    message: 'Too many inquiries sent from this IP, please try again after an hour.',
  },
});

// PUBLIC ENDPOINT
// POST /api/v1/contact-inquiries
router.post(
  '/',
  publicInquiryRateLimiter,
  validateRequest(createContactInquirySchema),
  contactInquiryController.createInquiry
);

// ADMIN ENDPOINTS
router.use(authenticate);
router.use(authorize('superadmin'));

// GET /api/v1/contact-inquiries
router.get(
  '/',
  validateRequest(listContactInquiriesSchema, 'query'),
  contactInquiryController.getInquiries
);

// GET /api/v1/contact-inquiries/:id
router.get(
  '/:id',
  validateRequest(contactInquiryIdSchema, 'params'),
  contactInquiryController.getInquiryById
);

// PATCH /api/v1/contact-inquiries/:id
router.patch(
  '/:id',
  validateRequest(contactInquiryIdSchema, 'params'),
  validateRequest(updateContactInquiryStatusSchema, 'body'),
  contactInquiryController.updateInquiryStatus
);

module.exports = router;
