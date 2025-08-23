const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticationMiddleware } = require('common/middlewares/authentication');

// Route không cần xác thực
router.post('/register', authController.register);
router.post('/login', authController.login);

router.use(authenticationMiddleware);

// Route cần xác thực
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;