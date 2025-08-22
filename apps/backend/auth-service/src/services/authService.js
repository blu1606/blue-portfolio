// src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db/initSupabase');
const { ConflictRequestError, BadRequestError, AuthFailureError } = require('../core/error.response');

const registerUser = async ({ username, email, password }) => {
    try {
        // Kiểm tra xem email đã tồn tại chưa
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            throw new ConflictRequestError('Email already registered');
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Lưu vào database
        const { data, error } = await supabase
            .from('users')
            .insert([{ 
                username: username,
                email: email,
                password_hash: hashedPassword
            }]);

        if (error) {
            throw new BadRequestError(error.message);
        }

        return data;

    } catch (error) {
        throw error; // Reroute lỗi để middleware xử lý
    }
};

const loginUser = async ({ email, password }) => {
    try {
        // Tìm người dùng
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, password_hash')
            .eq('email', email)
            .single();

        if (error || !users) {
            throw new AuthFailureError('Invalid credentials');
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, users.password_hash);
        if (!isMatch) {
            throw new AuthFailureError('Invalid credentials');
        }
        
        // Tạo JWT
        const token = jwt.sign(
            { id: users.id, username: users.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return token;
        
    } catch (error) {
        throw error; // Reroute lỗi để middleware xử lý
    }
};

module.exports = {
    registerUser,
    loginUser
};