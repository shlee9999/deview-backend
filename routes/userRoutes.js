const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/ranking', userController.getUserRanking);

module.exports = router;
