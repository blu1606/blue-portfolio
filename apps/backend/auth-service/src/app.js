// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const { setupContainer } = require('./bootstrap');
const { createHealthController } = require('./controllers/healthController');
const { swaggerUi, specs } = require('./docs/swagger.config');

const {
  requestTimer,
  memoryMonitor,
  requestRateMonitor
} = require('./middlewares/performanceMiddleware.simple');

const app = express();

// Setup DI container
const container = setupContainer();

// Setup controllers
const healthController = createHealthController(container);

// Performance monitoring
app.use(requestTimer);
app.use(memoryMonitor);
app.use(requestRateMonitor);

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // For Swagger UI
}));

// CORS Configuration - NEVER use cors() without options in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours preflight cache
};

app.use(cors(corsOptions));

// Body parsing with input sanitization
const { sanitizeInput } = require('./middlewares/sanitization');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (after body parsing)
app.use(sanitizeInput);

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// Advanced rate limiting (simplified for now)
const rateLimit = require('express-rate-limit');
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api/', globalRateLimit);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/v1/auth', authRoutes);

// Health routes
app.get('/api/v1/health', healthController.healthCheck);
app.get('/api/v1/metrics', healthController.getMetrics);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'auth-service'
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
  // Check both status and statusCode for compatibility
  const statusCode = error.status || error.statusCode || 500;
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

  // Send consistent error response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app;