const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const commentMiddleware = require('../middleware/commentMiddleware');
const optionalJwtMiddleware = require('../middleware/optionalJwtMiddleware');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.post('/', jwtMiddleware, commentController.createComment);
router.get('/myself', jwtMiddleware, commentController.getMyComments);
router.get(
  '/:postId',
  optionalJwtMiddleware,
  commentController.getCommentsByPostId
);
router.patch(
  '/:commentId',
  jwtMiddleware,
  commentMiddleware.isCommentAuthor,
  commentController.updateComment
);
router.delete(
  '/:commentId',
  jwtMiddleware,
  commentMiddleware.isCommentAuthor,
  commentController.deleteComment
);

// 댓글 좋아요 관련 라우트
router.post('/:commentId/thumb', jwtMiddleware, commentController.toggleThumb);
router.get(
  '/:commentId/thumb',
  optionalJwtMiddleware,
  commentController.getThumbStatus
);

module.exports = router;
