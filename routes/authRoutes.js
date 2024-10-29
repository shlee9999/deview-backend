const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jwtMiddleware = require('../middleware/jwtMiddleware');
router.get('/user', jwtMiddleware, authController.user);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/check-password', jwtMiddleware, authController.checkPassword);
router.put('/update', jwtMiddleware, authController.updateUser);

module.exports = router;
