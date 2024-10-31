const mongoose = require('mongoose');
const moment = require('moment-timezone');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // 알림을 받을 유저의 ID
    title: {
      type: String,
      required: true,
    }, // 알림 메시지 내용
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: false,
    }, // 관련된 게시물 (선택 사항)
    content: {
      type: String,
      required: false,
    }, // 댓글 내용 (선택 사항)
    isRead: {
      type: Boolean,
      default: false,
    }, // 알림이 읽혔는지 여부
    createdAt: {
      type: Date,
      get: (date) =>
        moment(date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }, // 알림 생성 시간
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
