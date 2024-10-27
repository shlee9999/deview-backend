const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author');
    return res.status(200).json(posts); // 200 OK
  } catch (error) {
    return res.status(500).json({ message: '게시물 조회 실패' });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id }).populate('author');
    return res.status(200).json(posts); // 200 OK
  } catch (error) {
    return res.status(500).json({ message: '내 게시물 조회 실패' });
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
    const postId = req.post._id;

    await Comment.deleteMany({ postId }); // 게시물에 연결된 모든 댓글 삭제
    await Post.findByIdAndDelete(postId); // 게시물 삭제

    return res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('게시물 삭제 중 오류 발생:', error);
    return res.status(500).json({ message: '게시물 삭제 실패' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // 이미 좋아요 했는지 확인
    const existingLike = await Like.findOne({
      user: userId,
      post: postId,
    });

    if (existingLike) {
      // 좋아요 취소
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      });

      return res.json({
        message: '좋아요가 취소되었습니다',
        liked: false,
      });
    }

    // 새로운 좋아요 생성
    const newLike = new Like({
      user: userId,
      post: postId,
    });
    await newLike.save();

    await Post.findByIdAndUpdate(postId, {
      $inc: { likesCount: 1 },
    });

    res.json({
      message: '좋아요가 추가되었습니다',
      liked: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      // 중복 좋아요 시도
      return res.status(400).json({
        message: '이미 좋아요를 누르셨습니다',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// 게시물의 좋아요 상태 확인
exports.getLikeStatus = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const like = await Like.findOne({
      user: userId,
      post: postId,
    });

    const likesCount = await Like.countDocuments({ post: postId });

    res.json({
      liked: !!like,
      likesCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
