// /cms-service/src/app.js
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const cmsRoutes = require('./routes/cmsRoutes');

const app = express();

// init middlewares
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init routes
app.use('/api/v1', cmsRoutes); // Đường dẫn gốc cho các route của CMS

// Handling error (404 Not Found)
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Handling general error
app.use((error, req, res, next) => {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message || 'Internal Server Error'
    });
});

module.exports = app;