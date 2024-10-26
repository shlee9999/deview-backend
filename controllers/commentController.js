const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const author = req.user._id;

    const comment = new Comment({ postId, content, author });
    await comment.save();

    res.status(201).json({ message: 'Comment created successfully', comment });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating comment', error: error.message });
  }
};

exports.getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId }).populate(
      'author',
      'username'
    );

    res.status(200).json({ comments });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error retrieving comments', error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = req.comment; // Set by isCommentAuthor middleware

    comment.content = content;
    comment.updatedAt = Date.now();
    await comment.save();

    res.status(200).json({ message: 'Comment updated successfully', comment });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating comment', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = req.comment; // Set by isCommentAuthor middleware

    await comment.deleteOne();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error deleting comment', error: error.message });
  }
};
