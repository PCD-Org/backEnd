const mongoose = require('mongoose');

const impactStatisticSchema = new mongoose.Schema(
  {
    label: {
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
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // Clean up mongoose internal fields
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('ImpactStatistic', impactStatisticSchema);
