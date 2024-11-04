const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Scrap = require('../models/Scrap');
const View = require('../models/View');
const getPaginated = require('../utils/getPaginated');

exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = { hidden: false };
    const populateOptions = {
      path: 'author',
      select: 'userId',
    };
    const result = await getPaginated(
      Post,
      query,
      page,
      limit,
      { createdAt: -1 },
      populateOptions
    );

    return res.status(200).json({
      posts: result.items,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalPosts: result.totalItems,
    });
  } catch (error) {
    return res.status(500).json({ message: '게시물 조회 실패' });
  }
};

exports.getPopularPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = { hidden: false };
    const populateOptions = {
      path: 'author',
      select: 'userId',
    };
    const result = await getPaginated(
      Post,
      query,
      page,
      limit,
      {
        likesCount: -1,
      },
      populateOptions
    );
    return res.status(200).json({
      posts: result.items,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalPosts: result.totalItems,
    });
  } catch (error) {
    return res.status(500).json({ message: '인기 게시물 조회 실패' });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const {
      keyword,
      devDependencies = [],
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { hidden: false };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { detail: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (devDependencies.length) {
      query.devDependencies = {
        $all: devDependencies,
      };
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const populateOptions = {
      path: 'author',
      select: 'userId',
    };

    const result = await getPaginated(
      Post,
      query,
      parseInt(page),
      parseInt(limit),
      sortOptions,
      populateOptions
    );

    res.json({
      posts: result.items,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalPosts: result.totalItems,
    });
  } catch (error) {
    console.error('게시물 검색 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const query = { author: req.user._id, hidden: false };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortOptions = { createdAt: -1 };
    const populateOptions = {
      path: 'author',
      select: 'userId',
    };
    const result = await getPaginated(
      Post,
      query,
      page,
      limit,
      sortOptions,
      populateOptions
    );
    return res.status(200).json({
      posts: result.items,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalPosts: result.totalItems,
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
    const post = await Post.findOne({ _id: postId, hidden: false }).populate({
      path: 'author',
      select: 'userId', // 필요한 작성자 정보만 선택
    });

    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다' });
    }
    post.setCurrentUser(userId);
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
    const { title, code, detail, devDependencies, devVersions } = req.body;

    const post = new Post({
      title,
      code,
      detail,
      author: req.user._id,
      devDependencies,
      devVersions,
    });

    await post.save();
    return res.status(201).json(post); // 201 Created
  } catch (error) {
    return res.status(500).json({ message: '게시물 작성 실패' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, code, detail, devDependencies, devVersions } = req.body;
    const post = req.post;

    post.title = title;
    post.code = code;
    post.detail = detail;
    post.devDependencies = devDependencies;
    post.devVersions = devVersions;

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
      Scrap.findOne({ user: userId, post: postId, hidden: false }),
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

    const query = { user: req.user._id, hidden: false };
    const sortOptions = { createdAt: -1 };
    const populateOptions = {
      path: 'post',
      populate: { path: 'author', select: 'userId' },
    };

    const result = await getPaginated(
      Scrap,
      query,
      page,
      limit,
      sortOptions,
      populateOptions
    );

    const posts = result.items.map((scrap) => scrap.post);

    return res.status(200).json({
      posts,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalScraps: result.totalItems,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '스크랩 목록 조회 중 오류가 발생했습니다' });
  }
};

exports.getRecentUnansweredPosts = async (req, res) => {
  try {
    const recentUnansweredPosts = await Post.find({
      commentsCount: 0,
      hidden: false,
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .populate({
        path: 'author',
        select: 'userId',
      });

    if (recentUnansweredPosts.length === 0) {
      return res
        .status(404)
        .json({ message: '답변이 없는 최근 게시물이 없습니다.' });
    }

    return res.status(200).json(recentUnansweredPosts);
  } catch (error) {
    console.error('답변 없는 최근 게시물 조회 중 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

exports.getMostViewedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1; // 기본값으로 1개의 게시글을 반환

    const mostViewedPosts = await Post.find({ hidden: false })
      .sort({ viewsCount: -1 })
      .limit(limit)
      .populate({
        path: 'author',
        select: 'userId',
      });

    if (mostViewedPosts.length === 0) {
      return res.status(404).json({ message: '게시글이 없습니다.' });
    }

    return res.status(200).json(mostViewedPosts);
  } catch (error) {
    console.error('최다 조회수 게시글 조회 중 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

exports.getMostViewedPostToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mostViewedPost = await Post.findOne({
      createdAt: { $gte: today, $lt: tomorrow },
      hidden: false,
    })
      .sort({ viewsCount: -1 })
      .populate({
        path: 'author',
        select: 'userId',
      });

    if (!mostViewedPost) {
      return res
        .status(404)
        .json({ message: '오늘 올라온 게시글이 없습니다.' });
    }

    return res.status(200).json(mostViewedPost);
  } catch (error) {
    console.error('오늘 가장 조회수 높은 게시글 조회 중 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

exports.getHiddenPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = { hidden: true };
    const sortOptions = { createdAt: -1 };
    const populateOptions = { path: 'author', select: 'userId' };

    const result = await getPaginated(
      Post,
      query,
      page,
      limit,
      sortOptions,
      populateOptions
    );

    return res.status(200).json({
      posts: result.items,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalPosts: result.totalItems,
    });
  } catch (error) {
    console.error('숨겨진 게시물 조회 중 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
