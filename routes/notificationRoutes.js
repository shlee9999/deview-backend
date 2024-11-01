const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.get('/', jwtMiddleware, notificationController.getNotifications);
router.delete('/:id', jwtMiddleware, notificationController.deleteNotification);
router.put('/:id/read', jwtMiddleware, notificationController.readNotification);

module.exports = router;
