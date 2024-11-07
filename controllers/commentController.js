const { userSocketMap } = require('../config/socket');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Thumb = require('../models/Thumb');
const User = require('../models/User');
exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    // 댓글 작성자와 게시물 작성자가 동일한지 확인
    const author = req.user._id;
    const user = await User.findById(author); // 사용자 정보 조회

    if (author.toString() === post.author.toString()) {
      // 자신의 게시물에는 알림을 보내지 않음
      console.log('자신의 게시물에는 알림을 보내지 않습니다.');
    } else {
      // 게시물 작성자에게 알림 전송
      const io = req.app.get('io');
      const postAuthorId = post.author.toString(); // 게시물 작성자 ID

      // 데이터베이스에 항상 알림 저장
      const notification = new Notification({
        user: postAuthorId,
        title: `${user.userId}님이 회원님의 게시물에 댓글을 달았습니다.`,
        post: post._id,
        content,
        sender: author,
      });

      await notification.save();

      if (userSocketMap.has(postAuthorId)) {
        // 게시물 작성자가 접속 중일 경우 실시간으로 알림 전송
        const sockets = userSocketMap.get(postAuthorId);
        sockets.forEach((socketId) => {
          io.to(socketId).emit('newNotification', {
            message: '새로운 댓글이 달렸습니다.',
            postId: post._id,
            commentContent: content,
          });
        });
      }
    }

    // 댓글 저장 및 댓글 수 증가
    await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentsCount: 1 } },
      { new: true, timestamps: false }
    );

    const comment = new Comment({ postId, content, author });
    await comment.save();
    comment.setCurrentUser(author);

    return res.status(201).json(comment);
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 작성 실패', error: error.message });
  }
};

exports.getMyComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ author: req.user._id })
      .populate({ path: 'author', select: 'userId' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    comments.forEach((comment) => comment.setCurrentUser(req.user._id));
    // 댓글에 연관된 게시물의 제목 가져오기
    const commentsWithPostTitles = await Promise.all(
      comments.map(async (comment) => {
        const post = await Post.findOne({ _id: comment.postId }, 'title');
        return {
          ...comment.toObject(),
          postTitle: post ? post.title : 'Unknown post',
        };
      })
    );

    const totalComments = await Comment.countDocuments({
      author: req.user._id,
    });
    const totalPages = Math.ceil(totalComments / limit);

    return res.status(200).json({
      comments: commentsWithPostTitles,
      totalPages,
      currentPage: page,
      totalComments,
    });
  } catch (error) {
    return res.status(500).json({ message: '내 댓글 조회 실패' });
  }
};

exports.getCommentsByPostId = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [comments, totalComments] = await Promise.all([
      Comment.find({ postId })
        .populate({ path: 'author', select: 'userId' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ postId }),
    ]);
    comments.forEach((comment) => comment.setCurrentUser(userId));

    const commentsWithThumbs = await Promise.all(
      comments.map(async (comment) => {
        const [thumb, thumbsCount] = await Promise.all([
          userId ? Thumb.findOne({ user: userId, comment: comment._id }) : null,
          Thumb.countDocuments({ comment: comment._id }),
        ]);

        return {
          ...comment.toObject(),
          thumbed: !!thumb,
          thumbsCount,
        };
      })
    );

    const totalPages = Math.ceil(totalComments / limit);

    return res.status(200).json({
      comments: commentsWithThumbs,
      currentPage: page,
      totalPages: totalPages,
      totalComments: totalComments,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 조회 중 오류가 발생했습니다' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = req.comment; // Set by isCommentAuthor middleware

    comment.content = content;
    await comment.save();
    comment.setCurrentUser(req.user._id);
    return res.status(200).json(comment);
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 수정 실패', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = req.comment; // Set by isCommentAuthor middleware
    const postId = comment.postId;

    await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentsCount: -1 } },
      { new: true, timestamps: false }
    ); // 게시물 댓글 수 감소
    await comment.deleteOne();

    return res.status(204).json(); // 204 No Content
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 삭제 실패', error: error.message });
  }
};

exports.toggleThumb = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const [comment, existingThumb] = await Promise.all([
      Comment.findById(commentId),
      Thumb.findOne({ user: userId, comment: commentId }),
    ]);

    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다' });
    }

    if (existingThumb) {
      await Promise.all([
        Thumb.deleteOne({ _id: existingThumb._id }),
        Comment.findByIdAndUpdate(
          commentId,
          { $inc: { thumbsCount: -1 } },
          { timestamps: false }
        ),
      ]);

      return res.status(200).json({
        message: '좋아요가 취소되었습니다',
        thumbed: false,
        thumbsCount: comment.thumbsCount - 1,
      });
    }

    const newThumb = new Thumb({ user: userId, comment: commentId });
    await Promise.all([
      newThumb.save(),
      Comment.findByIdAndUpdate(
        commentId,
        { $inc: { thumbsCount: 1 } },
        { timestamps: false }
      ),
    ]);

    return res.status(200).json({
      message: '좋아요가 추가되었습니다',
      thumbed: true,
      thumbsCount: comment.thumbsCount + 1,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 좋아요를 누르셨습니다' });
    }
    return res
      .status(500)
      .json({ message: '좋아요 처리 중 오류가 발생했습니다' });
  }
};

exports.getThumbStatus = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user?._id;

    const [thumb, thumbsCount] = await Promise.all([
      userId ? Thumb.findOne({ user: userId, comment: commentId }) : null,
      Thumb.countDocuments({ comment: commentId }),
    ]);

    return res.status(200).json({
      thumbed: !!thumb,
      thumbsCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '좋아요 상태 조회 중 오류가 발생했습니다' });
  }
};
