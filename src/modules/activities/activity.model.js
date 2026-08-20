const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    title: {
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },
      ar: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },
    },
    description: {
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },
      ar: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },
    },
    date: {
      type: Date,
      required: true,
    },
    coverImage: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    category: {
      key: {
        type: String,
        required: true,
        enum: ['relief', 'psychosocial', 'workshops', 'development'],
      },
      name: {
        en: {
          type: String,
          required: true,
        },
        ar: {
          type: String,
          required: true,
        },
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // Format date to YYYY-MM-DD
        if (ret.date) {
          ret.date = ret.date.toISOString().split('T')[0];
        }

        // Ensure coverImage is explicitly null if no url/publicId exists
        if (!ret.coverImage || (!ret.coverImage.url && !ret.coverImage.publicId)) {
          ret.coverImage = null;
        }

        // Clean up mongoose internal fields
        delete ret.__v;
        
        return ret;
      },
    },
  }
);

// Index 1: Supports Pattern A (All active activities sorted by date)
activitySchema.index({ isDeleted: 1, date: -1 });

// Index 2: Supports Pattern B (Active activities filtered by category and sorted by date)
activitySchema.index({ 'category.key': 1, isDeleted: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
