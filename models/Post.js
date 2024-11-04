const mongoose = require('mongoose');
const moment = require('moment-timezone');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    detail: { type: String, required: true },
    code: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    devDependencies: [{ type: String, required: true }],
    devVersions: [{ type: String, required: true }],
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    scrapsCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
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
    reportCount: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

postSchema.virtual('isAuthor').get(function () {
  // 현재 사용자의 ID는 요청 객체(req.user._id)에서 받아와야 함
  if (!this.currentUserId) return false;
  return this.author._id.toString() === this.currentUserId.toString();
});

// 현재 사용자 ID를 설정하는 헬퍼 함수
postSchema.methods.setCurrentUser = function (userId) {
  this.currentUserId = userId;
};

postSchema.pre('find', function () {
  this.where({ hidden: false });
});

postSchema.pre('findOne', function () {
  this.where({ hidden: false });
});

// aggregate에도 적용하려면:
postSchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { hidden: false } });
});

module.exports = mongoose.model('Post', postSchema);
