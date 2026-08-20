const ContactInquiry = require('./contact-inquiry.model');

class ContactInquiryRepository {
  async createInquiry(data) {
    return await ContactInquiry.create(data);
  }

  async findInquiries({ filter, sort, skip, limit }) {
    return await ContactInquiry.find(filter).sort(sort).skip(skip).limit(limit);
  }

  async countInquiries(filter) {
    return await ContactInquiry.countDocuments(filter);
  }

  async findInquiryById(id) {
    return await ContactInquiry.findById(id);
  }

  async updateInquiryStatus(id, status) {
    return await ContactInquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
  }
}

module.exports = new ContactInquiryRepository();
