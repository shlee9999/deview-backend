const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: { type: String, required: true },
    createdAt: {
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

module.exports = mongoose.model('Report', reportSchema);
