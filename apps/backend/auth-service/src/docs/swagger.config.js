// src/docs/swagger.config.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'Authentication microservice for personal portfolio website',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            email_verified: { type: 'boolean' },
            profile_picture_url: { type: 'string', format: 'uri', nullable: true },
            bio: { type: 'string', nullable: true },
            location: { type: 'string', nullable: true },
            website: { type: 'string', format: 'uri', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            last_login_at: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        },
        ProfileUpdateRequest: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50 },
            bio: { type: 'string', maxLength: 500, nullable: true },
            location: { type: 'string', maxLength: 100, nullable: true },
            website: { type: 'string', format: 'uri', maxLength: 200, nullable: true }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication operations'
      },
      {
        name: 'User Management',
        description: 'User profile and account management'
      },
      {
        name: 'Password Management',
        description: 'Password reset and change operations'
      },
      {
        name: 'Health',
        description: 'Service health and monitoring'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};
