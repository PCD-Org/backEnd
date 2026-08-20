const adminService = require('./admin.service');
const { successResponse } = require('../../shared/utils/response');

class AdminController {
  async createAdmin(req, res, next) {
    try {
      const admin = await adminService.createAdmin(req.body);
      return successResponse(res, { admin }, null, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAdmins(req, res, next) {
    try {
      const admins = await adminService.getAllAdmins();
      return successResponse(res, { admins });
    } catch (error) {
      next(error);
    }
  }

  async getAdmin(req, res, next) {
    try {
      const admin = await adminService.getAdminById(req.params.id);
      return successResponse(res, { admin });
    } catch (error) {
      next(error);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const admin = await adminService.updateAdmin(req.params.id, req.body, req.admin);
      return successResponse(res, { admin });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
