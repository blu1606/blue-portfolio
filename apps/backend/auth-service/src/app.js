// src/app.js
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors'); // Thêm middleware CORS

const authRoutes = require('./routes/authRoutes');
const supabase = require('./db/initSupabase'); // Khởi tạo kết nối Supabase

const app = express();
const port = process.env.PORT || 3000;

// init middlewares
app.use(morgan('dev')); // Logging các request
app.use(helmet()); // Bảo mật HTTP headers
app.use(compression()); // Nén response để tăng tốc độ
app.use(cors()); // Cho phép các domain khác truy cập API
app.use(express.json()); // Phân tích JSON body
app.use(express.urlencoded({ extended: true })); // Phân tích URL-encoded body

// init routes
app.use('/api/v1/auth', authRoutes);

// Handling error (404 Not Found)
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Handling general error
app.use((error, req, res, next) => {
    const statusCode = error.status || statusCode.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message || reasonPhrases.INTERNAL_SERVER_ERROR
    });
});

module.exports = app;