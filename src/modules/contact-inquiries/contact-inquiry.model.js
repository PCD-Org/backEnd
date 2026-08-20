const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['new', 'read', 'replied'],
        message: '{VALUE} is not a valid status',
      },
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

contactInquirySchema.index({ status: 1, createdAt: -1 });

const ContactInquiry = mongoose.model('ContactInquiry', contactInquirySchema);

module.exports = ContactInquiry;
