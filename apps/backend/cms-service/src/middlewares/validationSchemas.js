// src/middlewares/validationSchemas.js
/**
 * JSON Schema definitions for request validation
 * Using with common/middlewares/validationMiddleware
 */

const { validateRequest } = require('common/middlewares/validationMiddleware');

// Post schemas
const createPostSchema = {
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 255
      },
      content: {
        type: 'string',
        minLength: 10,
        maxLength: 10000
      },
      contentType: {
        type: 'string',
        enum: ['html', 'markdown'],
        default: 'html'
      },
      isPublished: {
        type: 'boolean',
        default: false
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 50
        },
        maxItems: 10
      }
    },
    required: ['title', 'content'],
    additionalProperties: false
  }
};

const updatePostSchema = {
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 255
      },
      content: {
        type: 'string',
        minLength: 10,
        maxLength: 10000
      },
      contentType: {
        type: 'string',
        enum: ['html', 'markdown']
      },
      isPublished: {
        type: 'boolean'
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 50
        },
        maxItems: 10
      }
    },
    additionalProperties: false
  },
  params: {
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      }
    },
    required: ['postId']
  }
};

// Feedback schemas
const createFeedbackSchema = {
  body: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        minLength: 10,
        maxLength: 2000
      },
      rating: {
        type: 'integer',
        minimum: 1,
        maximum: 5
      }
    },
    required: ['content'],
    additionalProperties: false
  }
};

const createAnonymousFeedbackSchema = {
  body: {
    type: 'object',
    properties: {
      authorName: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      authorEmail: {
        type: 'string',
        format: 'email',
        maxLength: 254
      },
      content: {
        type: 'string',
        minLength: 10,
        maxLength: 2000
      },
      rating: {
        type: 'integer',
        minimum: 1,
        maximum: 5
      }
    },
    required: ['authorName', 'content'],
    additionalProperties: false
  }
};

// Comment schemas
const createCommentSchema = {
  body: {
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      },
      content: {
        type: 'string',
        minLength: 1,
        maxLength: 1000
      },
      parentId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      }
    },
    required: ['postId', 'content'],
    additionalProperties: false
  }
};

// Query schemas
const paginationSchema = {
  query: {
    type: 'object',
    properties: {
      limit: {
        type: 'string',
        pattern: '^[1-9][0-9]*$'
      },
      offset: {
        type: 'string',
        pattern: '^[0-9]+$'
      }
    },
    additionalProperties: true
  }
};

const searchSchema = {
  query: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 2,
        maxLength: 255
      },
      limit: {
        type: 'string',
        pattern: '^[1-9][0-9]*$'
      },
      offset: {
        type: 'string',
        pattern: '^[0-9]+$'
      }
    },
    required: ['query'],
    additionalProperties: false
  }
};

// Export validation middleware functions
module.exports = {
  validateCreatePost: validateRequest(createPostSchema),
  validateUpdatePost: validateRequest(updatePostSchema),
  validateCreateFeedback: validateRequest(createFeedbackSchema),
  validateCreateAnonymousFeedback: validateRequest(createAnonymousFeedbackSchema),
  validateCreateComment: validateRequest(createCommentSchema),
  validatePagination: validateRequest(paginationSchema),
  validateSearch: validateRequest(searchSchema)
};
