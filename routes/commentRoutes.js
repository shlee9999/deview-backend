const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const commentMiddleware = require('../middleware/commentMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, commentController.createComment);
router.get('/myself', verifyToken, commentController.getMyComments);
router.get(
  '/:postId',
  optionalAuthMiddleware,
  commentController.getCommentsByPostId
);
router.patch(
  '/:commentId',
  verifyToken,
  commentMiddleware.isCommentAuthor,
  commentController.updateComment
);
router.delete(
  '/:commentId',
  verifyToken,
  commentMiddleware.isCommentAuthor,
  commentController.deleteComment
);

// 댓글 좋아요 관련 라우트
router.post('/:commentId/thumb', verifyToken, commentController.toggleThumb);
router.get(
  '/:commentId/thumb',
  optionalAuthMiddleware,
  commentController.getThumbStatus
);

module.exports = router;
