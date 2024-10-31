const Notification = require('../models/Notification');
const getPaginated = require('../utils/getPaginated'); // getPaginated 함수 import

exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const query = { userId: req.user._id };
    const sortOptions = { createdAt: -1 };

    const paginatedResult = await getPaginated(
      Notification,
      query,
      page,
      limit,
      sortOptions
    );

    // 읽지 않은 알림 개수 가져오기
    const unreadNotificationsCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      notifications: paginatedResult.items,
      currentPage: paginatedResult.currentPage,
      totalPages: paginatedResult.totalPages,
      totalNotifications: paginatedResult.totalItems,
      unreadNotificationsCount, // 읽지 않은 알림 개수 포함
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '알림 조회 실패', error: error.message });
  }
};
