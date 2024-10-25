const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware');
const Post = require('../models/Post');

// 게시글 조회
router.get('/', async (req, res) => {
  const posts = await Post.find().populate('author');
  res.json(posts);
});

// 게시글 생성
router.post('/', jwtMiddleware, async (req, res) => {
  const { title, content, devDependencies } = req.body;

  const post = new Post({
    title,
    content,
    author: req.user._id,
    devDependencies,
  });
  await post.save();
  res.json(post);
});

router.put('/:id', jwtMiddleware, async (req, res) => {
  const { title, content, tags, devDependencies } = req.body;
  try {
    const post = await Post.findById(req.params.id);

    // 게시글 작성자와 토큰의 사용자 ID 비교
    if (post.author.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.title = title;
    post.content = content;
    post.tags = tags;
    post.devDependencies = devDependencies;
    post.updatedAt = Date.now();

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 게시글 삭제 라우트
router.delete('/:id', jwtMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // 게시글 작성자와 토큰의 사용자 ID 비교
    if (post.author.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
