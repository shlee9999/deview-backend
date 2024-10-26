const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const commentMiddleware = require('../middleware/commentMiddleware');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.post('/', jwtMiddleware, commentController.createComment);
router.get('/:postId', commentController.getCommentsByPostId);
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

module.exports = router;
