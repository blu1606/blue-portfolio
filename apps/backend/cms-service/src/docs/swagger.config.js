// src/docs/swagger.config.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CMS Service API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the CMS microservice of the personal portfolio website',
      contact: {
        name: 'API Support',
        email: 'support@portfolio.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      },
      {
        url: 'https://api.portfolio.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message description'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Detailed validation errors'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            metadata: {
              type: 'object',
              description: 'Response data payload'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          required: ['success', 'message', 'metadata'],
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Data retrieved successfully'
            },
            metadata: {
              type: 'object',
              required: ['data', 'total', 'limit', 'offset', 'hasMore'],
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object'
                  }
                },
                total: {
                  type: 'integer',
                  example: 150
                },
                limit: {
                  type: 'integer',
                  example: 20
                },
                offset: {
                  type: 'integer',
                  example: 0
                },
                hasMore: {
                  type: 'boolean',
                  example: true
                }
              }
            }
          }
        },
        Post: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            title: {
              type: 'string',
              example: 'My First Blog Post'
            },
            slug: {
              type: 'string',
              example: 'my-first-blog-post'
            },
            content: {
              type: 'string',
              example: 'This is the content of my blog post...'
            },
            content_html: {
              type: 'string',
              description: 'HTML version of content'
            },
            content_markdown: {
              type: 'string',
              description: 'Markdown version of content'
            },
            content_type: {
              type: 'string',
              enum: ['html', 'markdown'],
              example: 'html'
            },
            author_id: {
              type: 'string',
              format: 'uuid'
            },
            is_published: {
              type: 'boolean',
              example: true
            },
            published_at: {
              type: 'string',
              format: 'date-time'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            view_count: {
              type: 'integer',
              example: 125
            },
            tags: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Tag'
              }
            },
            media: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Media'
              }
            }
          }
        },
        PostCreate: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'My New Blog Post'
            },
            content: {
              type: 'string',
              minLength: 10,
              maxLength: 50000,
              example: 'This is the detailed content of my blog post...'
            },
            contentType: {
              type: 'string',
              enum: ['html', 'markdown'],
              default: 'html',
              example: 'html'
            },
            isPublished: {
              type: 'boolean',
              default: false,
              example: true
            },
            tags: {
              type: 'array',
              maxItems: 10,
              items: {
                type: 'string',
                maxLength: 50
              },
              example: ['technology', 'programming']
            }
          }
        },
        Feedback: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              nullable: true
            },
            author_name: {
              type: 'string',
              nullable: true,
              example: 'John Doe'
            },
            author_email: {
              type: 'string',
              format: 'email',
              nullable: true,
              example: 'john@example.com'
            },
            content: {
              type: 'string',
              example: 'Great website! I love the design and functionality.'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              nullable: true,
              example: 5
            },
            is_anonymous: {
              type: 'boolean',
              example: true
            },
            is_approved: {
              type: 'boolean',
              example: true
            },
            ip_address: {
              type: 'string',
              example: '192.168.1.1'
            },
            user_agent: {
              type: 'string',
              example: 'Mozilla/5.0...'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        FeedbackCreate: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              example: 'This is my feedback about the website'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 4
            }
          }
        },
        AnonymousFeedbackCreate: {
          type: 'object',
          required: ['authorName', 'content'],
          properties: {
            authorName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Anonymous User'
            },
            authorEmail: {
              type: 'string',
              format: 'email',
              maxLength: 320,
              example: 'user@example.com'
            },
            content: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              example: 'This is anonymous feedback about the website'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 5
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            post_id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            parent_id: {
              type: 'string',
              format: 'uuid',
              nullable: true
            },
            content: {
              type: 'string',
              example: 'Great article! Thanks for sharing.'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true
            }
          }
        },
        CommentCreate: {
          type: 'object',
          required: ['postId', 'content'],
          properties: {
            postId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 1000,
              example: 'This is my comment on the post'
            },
            parentId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of parent comment for nested replies'
            }
          }
        },
        Tag: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'technology'
            },
            slug: {
              type: 'string',
              example: 'technology'
            },
            description: {
              type: 'string',
              nullable: true
            },
            post_count: {
              type: 'integer',
              example: 15
            }
          }
        },
        Media: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            filename: {
              type: 'string',
              example: 'image.jpg'
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://cloudinary.com/image.jpg'
            },
            thumbnail_url: {
              type: 'string',
              format: 'uri'
            },
            file_size: {
              type: 'integer'
            },
            mime_type: {
              type: 'string',
              example: 'image/jpeg'
            },
            width: {
              type: 'integer'
            },
            height: {
              type: 'integer'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Posts',
        description: 'Blog post management operations'
      },
      {
        name: 'Feedback',
        description: 'Feedback and testimonial operations'
      },
      {
        name: 'Comments',
        description: 'Comment management operations'
      },
      {
        name: 'System',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/docs/routes/*.docs.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
