// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const { setupContainer } = require('./bootstrap');
const { createTagController } = require('./controllers/tagController');
const { createHealthController } = require('./controllers/healthController');

const {
  requestTimer,
  memoryMonitor,
  requestRateMonitor
} = require('./middlewares/performanceMiddleware.simple');
const { swaggerSpec, swaggerOptions } = require('./docs/swagger.config');

const app = express();

// Setup DI container
const container = setupContainer();

// Setup controllers
const tagController = createTagController(container);
const healthController = createHealthController(container);

// Performance monitoring
app.use(requestTimer);
app.use(memoryMonitor);
app.use(requestRateMonitor);

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow Swagger UI to work
}));
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Routes
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/feedback', feedbackRoutes);

// Tag routes
app.get('/api/v1/tags', tagController.getTags);
app.get('/api/v1/tags/search', tagController.searchTags);
app.get('/api/v1/tags/:tagId', tagController.getTagById);
app.post('/api/v1/tags', tagController.createTag);
app.put('/api/v1/tags/:tagId', tagController.updateTag);
app.delete('/api/v1/tags/:tagId', tagController.deleteTag);

// Health routes
app.get('/api/v1/health', healthController.healthCheck);
app.get('/api/v1/metrics', healthController.getMetrics);

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
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error
    })
  });
});

module.exports = app;