const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware');
const postController = require('../controllers/postController');
const postMiddleware = require('../middleware/postMiddleware');

router.get('/', postController.getAllPosts);
router.get('/myself', jwtMiddleware, postController.getMyPosts);
router.post('/', jwtMiddleware, postController.createPost);
router.put(
  '/:id',
  jwtMiddleware,
  postMiddleware.isPostAuthor,
  postController.updatePost
);
router.delete(
  '/:id',
  jwtMiddleware,
  postMiddleware.isPostAuthor,
  postController.deletePost
);
router.post('/:id/like', jwtMiddleware, postController.toggleLike);
router.get('/:id/like', jwtMiddleware, postController.getLikeStatus);

module.exports = router;
