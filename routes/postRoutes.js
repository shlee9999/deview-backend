const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware');
const postController = require('../controllers/postController');
const postMiddleware = require('../middleware/postMiddleware');
const optionalJwtMiddleware = require('../middleware/optionalJwtMiddleware');

router.get('/', postController.getAllPosts);
router.get('/user', jwtMiddleware, postController.getMyPosts);
router.get('/popular', optionalJwtMiddleware, postController.getPopularPosts);
router.get('/search', postController.searchPosts);
router.get('/recent-unanswered', postController.getRecentUnansweredPosts);

router.post('/', jwtMiddleware, postController.createPost);

router.put(
  '/:postId',
  jwtMiddleware,
  postMiddleware.isPostAuthor,
  postController.updatePost
);

router.delete(
  '/:postId',
  jwtMiddleware,
  postMiddleware.isPostAuthor,
  postController.deletePost
);

//게시물 좋아요
router.post('/:postId/like', jwtMiddleware, postController.toggleLike);
router.get('/:postId/like', jwtMiddleware, postController.getLikeStatus);

//게시물 스크랩
router.post('/:postId/scrap', jwtMiddleware, postController.toggleScrap);
router.get('/:postId/scrap', jwtMiddleware, postController.getScrapStatus);
router.get('/scraps', jwtMiddleware, postController.getMyScraps);

//게시물 상세조회
router.get('/:postId', optionalJwtMiddleware, postController.getPostDetail);

module.exports = router;
