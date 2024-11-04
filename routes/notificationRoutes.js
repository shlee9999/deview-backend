const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, notificationController.getNotifications);
router.put(
  '/read-all',
  verifyToken,
  notificationController.readAllNotifications
);

router.delete('/:id', verifyToken, notificationController.deleteNotification);
router.put('/:id/read', verifyToken, notificationController.readNotification);

module.exports = router;
