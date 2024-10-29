const Comment = require('../models/Comment');

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

    const totalPages = Math.ceil(totalUsers[0].count / limit);

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
