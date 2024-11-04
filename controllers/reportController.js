const Post = require('../models/Post');
const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const reporterId = req.user._id;

    // 게시물 존재 여부 확인
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    // 이미 신고한 경우 확인
    const existingReport = await Report.findOne({
      post: postId,
      reporter: reporterId,
    });
    if (existingReport) {
      return res
        .status(400)
        .json({ message: '이미 이 게시물을 신고하셨습니다.' });
    }

    // 새 신고 생성
    const newReport = new Report({
      post: postId,
      reporter: reporterId,
      reason,
    });

    await newReport.save();

    // 게시물의 신고 수 증가
    post.reportCount += 1;
    await post.save();

    if (post.reportCount >= 10) {
      post.hidden = true;
      await post.save();
      // 관리자에게 알림 전송 등의 추가 조치 가능
    }

    res.status(201).json({ message: '게시물이 성공적으로 신고되었습니다.' });
  } catch (error) {
    res
      .status(500)
      .json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
};
