const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.post('/:postId', verifyToken, reportController.createReport);

module.exports = router;
