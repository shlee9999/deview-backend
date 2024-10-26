const Post = require('../models/Post');

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author');
    return res.status(200).json(posts); // 200 OK
  } catch (error) {
    return res.status(500).json({ message: '게시물 조회 실패' });
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
    return res.status(201).json(post); // 201 Created
  } catch (error) {
    return res.status(500).json({ message: '게시물 작성 실패' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, content, tags, devDependencies } = req.body;
    const post = req.post;

    post.title = title;
    post.content = content;
    post.tags = tags;
    post.devDependencies = devDependencies;

    const updatedPost = await post.save();
    return res.status(200).json(updatedPost); // 200 OK
  } catch (error) {
    return res.status(500).json({ message: '게시물 수정 실패' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.post._id);
    return res.status(204).json(); // 204 No Content
  } catch (error) {
    return res.status(500).json({ message: '게시물 삭제 실패' });
  }
};
