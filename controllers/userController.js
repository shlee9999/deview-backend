const Post = require('../models/Post');

exports.getUserRanking = async (req, res) => {
  try {
    // Aggregate total likes for each user
    const rankings = await Post.aggregate([
      {
        $group: {
          _id: '$author',
          totalLikes: { $sum: '$likesCount' },
        },
      },
      {
        $sort: { totalLikes: -1 }, // Sort by totalLikes descending
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: '$userDetails',
      },
      {
        $project: {
          _id: 0,
          username: '$userDetails.username',
          totalLikes: 1,
        },
      },
    ]);

    res.json(rankings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
