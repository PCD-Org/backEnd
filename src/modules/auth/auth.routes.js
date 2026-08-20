const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { loginSchema } = require('./auth.validation');
const validateRequest = require('../../shared/middlewares/validate-request');
const authenticate = require('../../shared/middlewares/authenticate');

const router = express.Router();


const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only failed (4xx/5xx) attempts count toward the limit
});

// POST /api/v1/auth/login
router.post('/login', loginRateLimiter, validateRequest(loginSchema), authController.login);



// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.getMe);

module.exports = router;
