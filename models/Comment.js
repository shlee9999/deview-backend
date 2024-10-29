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

module.exports = mongoose.model('Comment', commentSchema);
