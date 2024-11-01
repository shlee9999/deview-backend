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

exports.readNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
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
    const userId = req.user._id; // JWT 미들웨어에서 제공하는 사용자 ID

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userId,
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
    const userId = req.user._id; // JWT 미들웨어에서 제공하는 사용자 ID

    // 현재 사용자의 모든 읽지 않은 알림을 읽음 처리
    const result = await Notification.updateMany(
      { userId: userId, isRead: false }, // 조건: 해당 사용자의 읽지 않은 알림
      { isRead: true } // 업데이트: isRead를 true로 설정
    );

    // 수정된 문서 수를 확인
    if (result.modifiedCount === 0) {
      return res.status(200).json({ message: '읽지 않은 알림이 없습니다.' });
    }

    return res.status(200).json({
      message: '모든 알림이 읽음 처리되었습니다.',
      modifiedCount: result.modifiedCount, // 업데이트된 알림 개수 반환
    });
  } catch (error) {
    console.error('알림 전체 읽음 처리 중 오류 발생:', error);
    return res.status(500).json({
      message: '알림 전체 읽음 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};
