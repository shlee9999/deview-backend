const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware');
const postController = require('../controllers/postController');

router.get('/', postController.getAllPosts);
router.post('/', jwtMiddleware, postController.createPost);
router.put('/:id', jwtMiddleware, postController.updatePost);
router.delete('/:id', jwtMiddleware, postController.deletePost);

module.exports = router;
