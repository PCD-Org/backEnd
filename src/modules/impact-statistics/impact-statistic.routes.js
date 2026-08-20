const express = require('express');
const impactStatisticController = require('./impact-statistic.controller');
const {
  createImpactStatisticSchema,
  updateImpactStatisticSchema,
  impactStatisticIdParamSchema,
} = require('./impact-statistic.validation');
const validateRequest = require('../../shared/middlewares/validate-request');
const authenticate = require('../../shared/middlewares/authenticate');
const authorize = require('../../shared/middlewares/authorize');

const router = express.Router();

// Public Routes
router.route('/').get(impactStatisticController.getImpactStatistics);

// Protected Admin Routes (superadmin only)
router.use(authenticate);
router.use(authorize('superadmin'));

router.route('/').post(validateRequest(createImpactStatisticSchema), impactStatisticController.createImpactStatistic);

router
  .route('/:id')
  .patch(
    validateRequest(impactStatisticIdParamSchema, 'params'),
    validateRequest(updateImpactStatisticSchema),
    impactStatisticController.updateImpactStatistic
  )
  .delete(validateRequest(impactStatisticIdParamSchema, 'params'), impactStatisticController.deleteImpactStatistic);

module.exports = router;
