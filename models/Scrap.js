const mongoose = require('mongoose');

const scrapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 중복 스크랩 방지
scrapSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model('Scrap', scrapSchema);
