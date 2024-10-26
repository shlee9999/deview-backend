const Post = require('../models/Post');

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author');
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content, devDependencies } = req.body;
    const post = new Post({
      title,
      content,
      author: req.user._id,
      devDependencies,
    });
    await post.save();
    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, content, tags, devDependencies } = req.body;
    const post = req.post; // 미들웨어에서 설정한 post 객체 사용

    post.title = title;
    post.content = content;
    post.tags = tags;
    post.devDependencies = devDependencies;
    post.updatedAt = Date.now();

    const updatedPost = await post.save();
    return res.json(updatedPost);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.post._id); // 미들웨어에서 설정한 post 객체의 ID 사용
    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
