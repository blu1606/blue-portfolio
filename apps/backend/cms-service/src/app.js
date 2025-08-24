// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const postRoutes = require('./routes/postRoutes');

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// Routes
app.use('/api/v1/posts', postRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'cms-service'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app;