const authService = require('../services/authService');
const { SuccessResponse, CREATED } = require('common/core/success.response.js'); 
const { ErrorResponse, ConflictRequestError, BadRequestError, AuthFailureError} = require('common/core/error.response.js')
const asyncHandler = require('common/helpers/asyncHandler'); 
class AuthController {
    register = asyncHandler(async (req, res, next) => {
        const { username, email, password } = req.body;
        // Bước 1: Validation
        // Kiểm tra các trường bắt buộc
        if (!username || !email || !password) {
            throw new BadRequestError('Username, email, and password are required.');
        }

        // Kiểm tra định dạng email
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            throw new BadRequestError('Invalid email format.');
        }

        // Kiểm tra độ dài mật khẩu (ví dụ: tối thiểu 6 ký tự)
        if (password.length < 6) {
            throw new BadRequestError('Password must be at least 6 characters long.');
        }
        // Bước 2: Gọi service và trả về response
        const newUser = await authService.registerUser({ username, email, password });
        new CREATED({
            message: 'Registered OK!',
            metadata: newUser,
        }).send(res);
    });

    login = asyncHandler(async (req, res, next) => {
        const { email, password } = req.body;
        // Bước 1: Validation
        // Kiểm tra các trường bắt buộc
        if (!email || !password) {
            throw new BadRequestError('Email and password are required.');
        }

        // Bước 2: Gọi service và trả về response
        const token = await authService.loginUser({ email, password });
        new SuccessResponse({
            message: 'Login successful!',
            metadata: { token },
        }).send(res);
    });

    getMe = asyncHandler(async (req, res, next) => {
        const user = req.user; // Lấy thông tin người dùng từ middleware
        new SuccessResponse({
            message: 'User profile fetched successfully!',
            metadata: user,
        }).send(res);
    });

    logout = asyncHandler(async (req, res, next) => {
        new SuccessResponse({
            message: 'Logout successful!',
        }).send(res);
    });

}

module.exports = new AuthController();