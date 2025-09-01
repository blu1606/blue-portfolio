// src/configs/env.config.js
require('dotenv').config();

const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'JWT_SECRET'
];

const validateEnv = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  database: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  
  jwt: {
    secret: process.env.JWT_SECRET
  },
  
  redis: {
    url: process.env.REDIS_URL
  },
  
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    allowedTypes: ['image', 'video']
  },
  
  cache: {
    defaultTTL: 3600 // 1 hour
  }
};

// Validate environment on module load
validateEnv();

module.exports = config;
