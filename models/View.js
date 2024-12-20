const mongoose = require('mongoose');
const moment = require('moment-timezone');

const viewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // 비로그인 사용자도 조회 가능하도록
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
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
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// 24시간 내 같은 IP 또는 같은 사용자의 중복 조회 방지
viewSchema.index({
  post: 1,
  ip: 1,
  createdAt: 1,
});

viewSchema.index({
  post: 1,
  user: 1,
  createdAt: 1,
});

module.exports = mongoose.model('View', viewSchema);
