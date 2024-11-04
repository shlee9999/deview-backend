const express = require('express');
const router = express.Router();
const {
  verifyToken,
  isAdmin,
  optional,
} = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');
const postMiddleware = require('../middleware/postMiddleware');

router.get('/', postController.getAllPosts);
router.get('/myself', verifyToken, postController.getMyPosts);
router.get('/popular', postController.getPopularPosts);
router.get('/search', postController.searchPosts);
router.get('/recent-unanswered', postController.getRecentUnansweredPosts);
router.get('/most-viewed', postController.getMostViewedPosts);
router.get('/most-viewed-today', postController.getMostViewedPostToday);
router.get('/hidden', verifyToken, isAdmin, postController.getHiddenPosts);

router.post('/', verifyToken, postController.createPost);

router.put(
  '/:postId',
  verifyToken,
  postMiddleware.isPostAuthorOrAdmin,
  postController.updatePost
);

router.delete(
  '/:postId',
  verifyToken,
  postMiddleware.isPostAuthorOrAdmin,
  postController.deletePost
);

//게시물 좋아요
router.post('/:postId/like', verifyToken, postController.toggleLike);
router.get('/:postId/like', verifyToken, postController.getLikeStatus);

//게시물 스크랩
router.post('/:postId/scrap', verifyToken, postController.toggleScrap);
router.get('/:postId/scrap', verifyToken, postController.getScrapStatus);
router.get('/scraps', verifyToken, postController.getMyScraps);

//게시물 상세조회
router.get('/:postId', optional, postController.getPostDetail);
module.exports = router;
