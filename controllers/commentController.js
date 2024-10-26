const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const author = req.user._id;

    const comment = new Comment({ postId, content, author });
    await comment.save();

    return res.status(201).json({ message: '댓글 작성 성공', comment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 작성 실패', error: error.message });
  }
};

exports.getMyComments = async (req, res) => {
  try {
    const comments = await Comment.find({ author: req.user._id }).populate(
      'author'
    );
    return res.status(200).json(comments); // 200 OK
  } catch (error) {
    return res.status(500).json({ message: '내 댓글 조회 실패' });
  }
};
exports.getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId }).populate(
      'author',
      'username'
    );

    return res.status(200).json({ comments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 조회에 실패하였습니다.', error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = req.comment; // Set by isCommentAuthor middleware

    comment.content = content;
    await comment.save();

    return res.status(200).json({ message: '댓글 수정 성공', comment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 수정 실패', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = req.comment; // Set by isCommentAuthor middleware

    await comment.deleteOne();

    return res.status(204).json(); // 204 No Content
  } catch (error) {
    return res
      .status(500)
      .json({ message: '댓글 삭제 실패', error: error.message });
  }
};
