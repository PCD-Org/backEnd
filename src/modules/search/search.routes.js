const express = require('express');
const rateLimit = require('express-rate-limit');
const searchController = require('./search.controller');
const { searchQuerySchema } = require('./search.validation');
const validateRequest = require('../../shared/middlewares/validate-request');

const router = express.Router();

// Lightweight Rate Limiter for Search
// 100 requests per 15 minutes per IP
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    success: false,
    message: 'Too many search requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.route('/')
  .get(
    searchLimiter,
    validateRequest(searchQuerySchema, 'query'), 
    searchController.search
  );

module.exports = router;
