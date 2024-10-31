const Post = require('../models/Post');
const Comment = require('../models/Comment');
const getPaginated = require('../utils/getPaginated');

exports.getUserRankings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 각 사용자의 총 thumbsCount를 계산하고 정렬
    const userRanking = await Comment.aggregate([
      {
        $group: {
          _id: '$author',
          totalThumbsCount: { $sum: '$thumbsCount' },
        },
      },
      { $sort: { totalThumbsCount: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 0,
          userId: '$userDetails.id',
          username: '$userDetails.username',
          group: '$userDetails.group',
          totalThumbsCount: 1,
        },
      },
    ]);

    // 전체 사용자 수 계산
    const totalUsers = await Comment.aggregate([
      {
        $group: {
          _id: '$author',
          totalThumbsCount: { $sum: '$thumbsCount' },
        },
      },
    ]).count('count');
    console.log(totalUsers);
    const totalPages = Math.ceil(totalUsers[0]?.count ?? 0 / limit);

    res.json({
      currentPage: page,
      totalPages: totalPages,
      userRanking: userRanking,
    });
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const query = { author: req.params.userId };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const sortOptions = { createdAt: -1 };

    const result = await getPaginated(Post, query, page, limit, sortOptions);

    return res.status(200).json({
      posts: result.items,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalPosts: result.totalItems,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '유저 게시물 조회 실패' });
  }
};
