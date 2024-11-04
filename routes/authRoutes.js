const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
router.get('/user', verifyToken, authController.user);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/auto-login', authController.autoLogin);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/check-password', verifyToken, authController.checkPassword);
router.put('/update', verifyToken, authController.updateUser);

module.exports = router;
