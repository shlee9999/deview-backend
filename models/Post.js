const mongoose = require('mongoose');
const moment = require('moment-timezone');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    devDependencies: { type: [String], required: true },
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    scrapsCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
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

module.exports = mongoose.model('Post', postSchema);
