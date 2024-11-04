const Post = require('../models/Post');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const User = require('../models/User'); // User 모델 추가
const { getAdminSocketIds, userSocketMap } = require('../config/socket');

exports.createReport = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const reporterId = req.user._id;

    const post = await Post.findById(postId).populate('author', '_id');
    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    const existingReport = await Report.findOne({
      post: postId,
      reporter: reporterId,
    });
    if (existingReport) {
      return res
        .status(400)
        .json({ message: '이미 이 게시물을 신고하셨습니다.' });
    }

    const newReport = new Report({
      post: postId,
      reporter: reporterId,
      reason,
    });
    await newReport.save();

    post.reportCount += 1;
    await post.save();
    console.log('신고 완료', post.reportCount);

    const REPORT_THRESHOLD = 5;

    if (post.reportCount >= REPORT_THRESHOLD) {
      post.hidden = true;
      await post.save();

      const io = req.app.get('io');
      const adminNotificationMessage = `${REPORT_THRESHOLD}번 이상 신고된 게시물이 숨김 처리되었습니다.`;

      // 관리자 사용자 찾기
      const adminUsers = await User.find({ role: 'admin' });

      // 각 관리자에게 알림 생성
      for (const admin of adminUsers) {
        const adminNotification = new Notification({
          user: admin._id,
          sender: post.author._id,
          title: adminNotificationMessage,
          post: post._id,
          content: `게시물 ID: ${post._id}`,
        });
        await adminNotification.save();
      }
      // 관리자 소켓으로 실시간 알림 전송
      getAdminSocketIds().forEach((adminSocketId) => {
        io.to(adminSocketId).emit('adminNotification', {
          message: `${REPORT_THRESHOLD}번 이상 신고된 게시물이 숨김 처리되었습니다.`,
          postId: post._id,
        });
        console.log('관리자에게 메시지를 보냄.', adminSocketId);
      });

      // 게시물 작성자에게 알림
      const authorNotification = new Notification({
        user: post.author._id,
        sender: adminUsers[0]._id,
        title: adminNotificationMessage,
        post: post._id,
        content: `귀하의 게시물이 ${REPORT_THRESHOLD}번 이상 신고되어 숨김 처리되었습니다. 관리자 검토 후 조치될 예정입니다.`,
      });
      await authorNotification.save();

      const authorSocket = userSocketMap.get(post.author._id.toString());
      if (authorSocket) {
        io.to(authorSocket).emit('newNotification', authorNotification);
        console.log('게시물 작성자에게 메시지를 보냄', authorSocket);
      }
    }

    res.status(201).json({ message: '게시물이 성공적으로 신고되었습니다.' });
  } catch (error) {
    console.error('신고 처리 중 오류 발생:', error);
    res
      .status(500)
      .json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
};
