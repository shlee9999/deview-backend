const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware');
const postController = require('../controllers/postController');
const postMiddleware = require('../middleware/postMiddleware');

router.get('/', postController.getAllPosts);
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

module.exports = router;
