const express = require('express');
const adminController = require('./admin.controller');
const { createAdminSchema, updateAdminSchema } = require('./admin.validation');
const validateRequest = require('../../shared/middlewares/validate-request');
const authenticate = require('../../shared/middlewares/authenticate');
const authorize = require('../../shared/middlewares/authorize');

const router = express.Router();

// All admin management routes require authentication and superadmin role
router.use(authenticate);
router.use(authorize('superadmin'));

router.route('/')
  .post(validateRequest(createAdminSchema), adminController.createAdmin)
  .get(adminController.getAdmins);

router.route('/:id')
  .get(adminController.getAdmin)
  .patch(validateRequest(updateAdminSchema), adminController.updateAdmin);

module.exports = router;
