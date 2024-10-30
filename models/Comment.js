const mongoose = require('mongoose');
const moment = require('moment-timezone');

const commentSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    thumbsCount: { type: Number, default: 0 },
    createdAt: {
      type: Date,
      get: (date) =>
        moment(date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
    updatedAt: {
      type: Date,
      get: (date) =>
        moment(date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

commentSchema.virtual('isMine').get(function () {
  // 현재 사용자의 ID는 요청 객체(req.user._id)에서 받아와야 함
  if (!this.currentUserId) return false;
  return this.author._id.toString() === this.currentUserId.toString();
});

// 현재 사용자 ID를 설정하는 헬퍼 함수
commentSchema.methods.setCurrentUser = function (userId) {
  this.currentUserId = userId;
};

module.exports = mongoose.model('Comment', commentSchema);
