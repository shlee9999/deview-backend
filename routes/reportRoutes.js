const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware');
const reportController = require('../controllers/reportController');

router.post('/:postId', jwtMiddleware, reportController.createReport);

module.exports = router;
