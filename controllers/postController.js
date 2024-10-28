const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Scrap = require('../models/Scrap');
const View = require('../models/View');

exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
      Post.find()
        .populate({
          path: 'author',
          select: 'username',
        })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return res.status(200).json({
      posts: posts,
      currentPage: page,
      totalPages: totalPages,
      totalPosts: totalPosts,
    });
  } catch (error) {
    return res.status(500).json({ message: '게시물 조회 실패' });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments({ author: req.user._id });
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find({ author: req.user._id })
      .populate({ path: 'author', select: 'username' })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // 최신 게시물부터 정렬

    return res.status(200).json({
      posts,
      currentPage: page,
      totalPages,
      totalPosts,
    });
  } catch (error) {
    return res.status(500).json({ message: '내 게시물 조회 실패' });
  }
};

exports.getPostDetail = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user?._id; // 로그인하지 않은 사용자도 조회 가능하도록
    const userIp = req.ip;

    // 게시물 조회와 함께 작성자 정보도 가져옴
    const post = await Post.findById(postId).populate({
      path: 'author',
      select: 'username', // 필요한 작성자 정보만 선택
    });

    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다' });
    }

    // 24시간 이내 조회 기록 확인
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingView = await View.findOne({
      post: postId,
      $or: [{ ip: userIp }, { user: userId }],
      createdAt: { $gte: oneDayAgo },
    });

    // 24시간 이내 조회 기록이 없으면 조회수 증가
    if (!existingView) {
      const newView = new View({
        user: userId,
        post: postId,
        ip: userIp,
      });

      await Promise.all([
        newView.save(),
        Post.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } }),
      ]);
    }

    // 좋아요 수, 스크랩 수 조회
    const [likesCount, scrapsCount, viewsCount] = await Promise.all([
      Like.countDocuments({ post: postId }),
      Scrap.countDocuments({ post: postId }),
      View.countDocuments({ post: postId }),
    ]);

    // 로그인한 사용자의 경우 좋아요, 스크랩 여부 확인
    let liked = false;
    let scraped = false;

    if (userId) {
      const [likeStatus, scrapStatus] = await Promise.all([
        Like.findOne({ user: userId, post: postId }),
        Scrap.findOne({ user: userId, post: postId }),
      ]);

      liked = !!likeStatus;
      scraped = !!scrapStatus;
    }

    const response = {
      ...post.toObject(),
      likesCount,
      scrapsCount,
      viewsCount,
      liked,
      scraped,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('게시물 상세 조회 중 오류:', error);
    return res
      .status(500)
      .json({ message: '게시물 상세 조회 중 오류가 발생했습니다' });
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
    const postId = req.params.postId; // id -> postId로 통일
    const userId = req.user._id;

    const [post, existingLike] = await Promise.all([
      Post.findById(postId),
      Like.findOne({ user: userId, post: postId }),
    ]);

    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다' });
    }

    if (existingLike) {
      await Promise.all([
        Like.deleteOne({ _id: existingLike._id }),
        Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }),
      ]);

      return res.status(200).json({
        message: '좋아요가 취소되었습니다',
        liked: false,
        likesCount: post.likesCount - 1,
      });
    }

    const newLike = new Like({ user: userId, post: postId });
    await Promise.all([
      newLike.save(),
      Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }),
    ]);

    return res.status(200).json({
      message: '좋아요가 추가되었습니다',
      liked: true,
      likesCount: post.likesCount + 1,
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

exports.getLikeStatus = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const [like, likesCount] = await Promise.all([
      Like.findOne({ user: userId, post: postId }),
      Like.countDocuments({ post: postId }),
    ]);

    return res.status(200).json({
      liked: !!like,
      likesCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '좋아요 상태 조회 중 오류가 발생했습니다' });
  }
};

exports.toggleScrap = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const [post, existingScrap] = await Promise.all([
      Post.findById(postId),
      Scrap.findOne({ user: userId, post: postId }),
    ]);

    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다' });
    }

    if (existingScrap) {
      await Promise.all([
        Scrap.deleteOne({ _id: existingScrap._id }),
        Post.findByIdAndUpdate(postId, { $inc: { scrapsCount: -1 } }),
      ]);

      return res.status(200).json({
        message: '스크랩이 취소되었습니다',
        scraped: false,
        scrapsCount: post.scrapsCount - 1,
      });
    }

    const newScrap = new Scrap({ user: userId, post: postId });
    await Promise.all([
      newScrap.save(),
      Post.findByIdAndUpdate(postId, { $inc: { scrapsCount: 1 } }),
    ]);

    return res.status(200).json({
      message: '게시물이 스크랩되었습니다',
      scraped: true,
      scrapsCount: post.scrapsCount + 1,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 스크랩한 게시물입니다' });
    }
    return res
      .status(500)
      .json({ message: '스크랩 처리 중 오류가 발생했습니다' });
  }
};

exports.getScrapStatus = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const [scrap, scrapsCount] = await Promise.all([
      Scrap.findOne({ user: userId, post: postId }),
      Scrap.countDocuments({ post: postId }),
    ]);

    return res.status(200).json({
      scraped: !!scrap,
      scrapsCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '스크랩 상태 조회 중 오류가 발생했습니다' });
  }
};

exports.getMyScraps = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalScraps = await Scrap.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalScraps / limit);

    const scraps = await Scrap.find({ user: req.user._id })
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'username' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const posts = scraps.map((scrap) => scrap.post);
    return res.status(200).json({
      posts,
      currentPage: page,
      totalPages,
      totalScraps,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '스크랩 목록 조회 중 오류가 발생했습니다' });
  }
};
