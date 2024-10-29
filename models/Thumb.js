const mongoose = require('mongoose');
const moment = require('moment-timezone');

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
    createdAt: {
      type: Date,
      default: () => moment().tz('Asia/Seoul').toDate(),
      get: (date) =>
        moment(date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
    updatedAt: {
      type: Date,
      default: () => moment().tz('Asia/Seoul').toDate(),
      get: (date) =>
        moment(date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// 중복 좋아요 방지
thumbSchema.index({ user: 1, comment: 1 }, { unique: true });

module.exports = mongoose.model('Thumb', thumbSchema);
