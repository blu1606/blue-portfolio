// src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db/initSupabase');
const { ConflictRequestError, BadRequestError, AuthFailureError } = require('common/core/error.response');

const registerUser = async ({ username, email, password }) => {
    // Kiểm tra xem email đã tồn tại chưa
    const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        throw new ConflictRequestError('Email already registered');
    }

    if (findError && findError.code !== 'PGRST116') { // PGRST116 là mã lỗi 'không tìm thấy'
        throw new BadRequestError(findError.message);
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
};

const loginUser = async ({ email, password }) => {
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
};

module.exports = {
    registerUser,
    loginUser
};