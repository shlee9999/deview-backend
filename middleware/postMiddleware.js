const Post = require('../models/Post');

exports.isPostAuthorOrAdmin = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 사용자가 게시글 작성자이거나 관리자인 경우 허용
    if (
      post.author.toString() === req.user._id.toString() ||
      req.user.role === 'admin'
    ) {
      req.post = post;
      next();
    } else {
      return res
        .status(403)
        .json({ message: '이 게시글을 수정할 권한이 없습니다.' });
    }
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res
        .status(400)
        .json({ message: '유효하지 않은 게시글 ID입니다.' });
    }
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};
