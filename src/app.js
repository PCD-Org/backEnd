const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/env');

const notFoundHandler = require('./shared/middlewares/not-found');
const errorHandler = require('./shared/middlewares/error-handler');
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admins/admin.routes');
const activityRoutes = require('./modules/activities/activity.routes');
const impactStatisticRoutes = require('./modules/impact-statistics/impact-statistic.routes');
const contactInquiryRoutes = require('./modules/contact-inquiries/contact-inquiry.routes');

// Create Express app
const app = express();

// 1. GLOBAL MIDDLEWARES
// Security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// Development logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// 2. ROUTES
// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PCED Backend API is running smoothly.',
  });
});

// Placeholder for future routes
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/impact-statistics', impactStatisticRoutes);
app.use('/api/v1/contact-inquiries', contactInquiryRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admins', adminRoutes);
app.use('/api/v1/search', require('./modules/search/search.routes'));

// 3. ERROR HANDLING
// Handle 404 for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
