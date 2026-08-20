const express = require('express');
const activityController = require('./activity.controller');
const { 
  createActivitySchema, 
  updateActivitySchema, 
  listActivitiesQuerySchema, 
  activityIdParamSchema 
} = require('./activity.validation');
const validateRequest = require('../../shared/middlewares/validate-request');
const authenticate = require('../../shared/middlewares/authenticate');
const authorize = require('../../shared/middlewares/authorize');
const upload = require('../../shared/middlewares/upload.middleware');
const parseMultipart = require('../../shared/middlewares/parse-multipart.middleware');

const router = express.Router();

const wrapUpload = (field) => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err) {
      return next(new (require('../../shared/errors/AppError'))(err.message, 400));
    }
    next();
  });
};

// Public Routes
router.route('/')
  .get(validateRequest(listActivitiesQuerySchema, 'query'), activityController.getActivities);

router.route('/:id')
  .get(validateRequest(activityIdParamSchema, 'params'), activityController.getActivity);

// Protected Admin Routes (superadmin only)
router.use(authenticate);
router.use(authorize('superadmin'));

router.route('/')
  .post(
    wrapUpload('coverImage'),
    parseMultipart,
    validateRequest(createActivitySchema),
    activityController.createActivity
  );

router.route('/:id')
  .patch(
    validateRequest(activityIdParamSchema, 'params'),
    wrapUpload('coverImage'),
    parseMultipart,
    validateRequest(updateActivitySchema),
    activityController.updateActivity
  )
  .delete(
    validateRequest(activityIdParamSchema, 'params'),
    activityController.deleteActivity
  );

module.exports = router;
