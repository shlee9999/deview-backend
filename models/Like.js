// models/Like.js
const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
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
  { timestamps: true }
);

// 같은 사용자가 같은 게시물에 중복 좋아요 방지
likeSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
