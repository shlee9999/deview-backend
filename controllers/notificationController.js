const Notification = require('../models/Notification');
const getPaginated = require('../utils/getPaginated');

exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const query = { user: req.user._id };
    const sortOptions = { createdAt: -1 };
    const populateOptions = [
      {
        path: 'user',
        select: 'userId',
      },
      {
        path: 'postId',
        select: '_id',
      },
      {
        path: 'sender',
        select: 'userId',
      },
    ];
    const paginatedResult = await getPaginated(
      Notification,
      query,
      page,
      limit,
      sortOptions,
      populateOptions
    );

    const unreadNotificationsCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      notifications: paginatedResult.items,
      currentPage: paginatedResult.currentPage,
      totalPages: paginatedResult.totalPages,
      totalNotifications: paginatedResult.totalItems,
      unreadNotificationsCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '알림 조회 실패', error: error.message });
  }
};

exports.readNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }

    return res
      .status(200)
      .json({ message: '알림이 읽음 처리되었습니다.', notification });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '알림 읽기 실패', error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const user = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ message: '알림을 찾을 수 없거나 삭제 권한이 없습니다.' });
    }

    return res
      .status(200)
      .json({ message: '알림이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('알림 삭제 중 오류 발생:', error);
    return res
      .status(500)
      .json({ message: '알림 삭제 중 오류가 발생했습니다.' });
  }
};

exports.readAllNotifications = async (req, res) => {
  try {
    const user = req.user._id;

    const result = await Notification.updateMany(
      { user, isRead: false },
      { isRead: true }
    );

    if (result.modifiedCount === 0) {
      return res.status(200).json({ message: '읽지 않은 알림이 없습니다.' });
    }

    return res.status(200).json({
      message: '모든 알림이 읽음 처리되었습니다.',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('알림 전체 읽음 처리 중 오류 발생:', error);
    return res.status(500).json({
      message: '알림 전체 읽음 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};
