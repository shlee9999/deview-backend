const mongoose = require('mongoose');

const thumbSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 중복 좋아요 방지
thumbSchema.index({ user: 1, comment: 1 }, { unique: true });

module.exports = mongoose.model('Thumb', thumbSchema);
