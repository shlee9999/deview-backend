const Post = require('../models/Post');

exports.isPostAuthor = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to modify this post' });
    }

    req.post = post;
    next();
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
