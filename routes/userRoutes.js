const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/rankings', userController.getUserRankings);
router.get('/:id/post', userController.getUserPosts);

module.exports = router;
