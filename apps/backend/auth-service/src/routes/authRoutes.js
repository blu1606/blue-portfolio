const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route để đăng ký người dùng mới
router.post('/register', authController.register);

// Route để đăng nhập
router.post('/login', authController.login);

// router.get('/me', authController.getMe);
// router.post('/logout', authController.logout);

module.exports = router;