const authService = require('../services/authService');
const { SuccessResponse, CREATED } = require('../core/success.response.js'); 
const asyncHandler = require('../helpers/asyncHandler'); 
class AuthController {
    register = asyncHandler(async (req, res, next) => {
        const { username, email, password } = req.body;
        const newUser = await authService.registerUser({ username, email, password });
        new CREATED({
            message: 'Registered OK!',
            metadata: newUser,
        }).send(res);
    });

    login = asyncHandler(async (req, res, next) => {
        const { email, password } = req.body;
        const token = await authService.loginUser({ email, password });
        new SuccessResponse({
            message: 'Login successful!',
            metadata: { token },
        }).send(res);
    });
}

module.exports = new AuthController();