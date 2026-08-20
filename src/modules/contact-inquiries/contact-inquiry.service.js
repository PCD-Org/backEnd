const contactInquiryRepository = require('./contact-inquiry.repository');
const AppError = require('../../shared/errors/AppError');

class ContactInquiryService {
  async createInquiry(data) {
    // Force status to 'new' for all newly created inquiries
    const inquiryData = {
      ...data,
      status: 'new',
    };
    return await contactInquiryRepository.createInquiry(inquiryData);
  }

  async getInquiries(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) {
      filter.status = query.status;
    }

    const sortDir = query.sort === 'asc' ? 1 : -1;
    const sort = { createdAt: sortDir };

    const [inquiries, total] = await Promise.all([
      contactInquiryRepository.findInquiries({ filter, sort, skip, limit }),
      contactInquiryRepository.countInquiries(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getInquiryById(id) {
    const inquiry = await contactInquiryRepository.findInquiryById(id);
    if (!inquiry) {
      throw new AppError('Contact inquiry not found', 404);
    }
    return inquiry;
  }

  async updateInquiryStatus(id, status) {
    const inquiry = await contactInquiryRepository.updateInquiryStatus(id, status);
    if (!inquiry) {
      throw new AppError('Contact inquiry not found', 404);
    }
    return inquiry;
  }
}

module.exports = new ContactInquiryService();
