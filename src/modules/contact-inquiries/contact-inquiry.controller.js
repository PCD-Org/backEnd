const contactInquiryService = require('./contact-inquiry.service');
const { successResponse } = require('../../shared/utils/response');

class ContactInquiryController {
  async createInquiry(req, res, next) {
    try {
      const inquiry = await contactInquiryService.createInquiry(req.body);
      return successResponse(res, { inquiry }, null, 201);
    } catch (error) {
      next(error);
    }
  }

  async getInquiries(req, res, next) {
    try {
      const result = await contactInquiryService.getInquiries(req.query);
      return successResponse(res, { inquiries: result.inquiries }, result.pagination, 200);
    } catch (error) {
      next(error);
    }
  }

  async getInquiryById(req, res, next) {
    try {
      const inquiry = await contactInquiryService.getInquiryById(req.params.id);
      return successResponse(res, { inquiry }, null, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateInquiryStatus(req, res, next) {
    try {
      const inquiry = await contactInquiryService.updateInquiryStatus(req.params.id, req.body.status);
      return successResponse(res, { inquiry }, null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContactInquiryController();
