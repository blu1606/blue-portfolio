# @blue-portfolio/common

Shared utilities and components for all microservices in the Blue Portfolio project.

## Overview

This package contains common utilities, services, middleware, and configurations that are shared across all microservices (auth-service, cms-service, ai-service, etc.). It promotes code reusability, consistency, and maintainability across the entire system.

## Installation

```bash
npm install @blue-portfolio/common
```

## Components

### Core Components
- **SuccessResponse**: Standardized success response format
- **Error Classes**: BadRequestError, NotFoundError, InternalServerError

### Utilities
- **Logger**: Centralized logging with structured output
- **RepositoryHelper**: Database operation helpers with error handling
- **CacheHelper**: Redis cache operations and patterns
- **DatabaseErrorHandler**: Database-specific error handling
- **CommonUtils**: General utility functions

### Configuration
- **ConfigManager**: Centralized configuration management

### Services
- **BaseService**: Base class for all services with common functionality

### Middlewares
- **Authentication**: JWT authentication middleware
- **Authorization**: Role-based authorization
- **Rate Limiting**: Request rate limiting
- **Validation**: Input validation middleware

## Usage Examples

### Logger
```javascript
const { createLogger } = require('@blue-portfolio/common');

const logger = createLogger('MyService');
logger.info('Service started');
logger.error('Error occurred', { error: error.message });
```

### Base Service
```javascript
const { BaseService } = require('@blue-portfolio/common');

class UserService extends BaseService {
  constructor(userRepository) {
    super('UserService');
    this.userRepository = userRepository;
  }

  async getUser(id) {
    return this.findById(this.userRepository, id, 'user');
  }
}
```

### Repository Helper
```javascript
const { RepositoryHelper } = require('@blue-portfolio/common');

class UserRepository {
  constructor(db) {
    this.db = db;
    this.helper = new RepositoryHelper('UserRepository');
  }

  async findById(id) {
    return this.helper.executeQuery('findById', 'users', async () => {
      return await this.db.users.findById(id);
    });
  }
}
```

### Cache Helper
```javascript
const { CacheHelper } = require('@blue-portfolio/common');

const cacheHelper = new CacheHelper(cacheService);

// Get with fallback
const user = await cacheHelper.getWithFallback(
  'user:123',
  () => userRepository.findById('123'),
  3600 // TTL in seconds
);

// Cache patterns
const posts = await cacheHelper.cacheList('posts', () => postRepository.findAll());
```

### Configuration Manager
```javascript
const { configManager } = require('@blue-portfolio/common');

const dbConfig = configManager.getDatabaseConfig();
const isFeatureEnabled = configManager.isFeatureEnabled('enableCaching');
```

### Error Handling
```javascript
const { BadRequestError, NotFoundError } = require('@blue-portfolio/common');

// In your service
if (!user) {
  throw new NotFoundError('User not found');
}

if (!email) {
  throw new BadRequestError('Email is required');
}
```

### Success Response
```javascript
const { SuccessResponse } = require('@blue-portfolio/common');

// In your controller
return new SuccessResponse('User created successfully', user, 201);
```

## Import Paths

The package supports multiple import patterns:

```javascript
// Main exports
const { createLogger, BaseService } = require('@blue-portfolio/common');

// Direct imports
const { createLogger } = require('@blue-portfolio/common/utils/logger');
const { BaseService } = require('@blue-portfolio/common/services/baseService');
```

## Features

### Logging
- Structured logging with multiple levels
- Context-aware logging
- Performance and cache operation logging
- Configurable output formats

### Error Handling
- Standardized error responses
- Database-specific error handling
- Automatic error logging and context capture

### Caching
- Redis cache operations
- Cache key generation
- Cache warming strategies
- Pattern-based invalidation

### Database Operations
- Standardized repository patterns
- Automatic error handling and logging
- Query performance monitoring

### Configuration
- Environment-based configuration
- Validation and defaults
- Feature flags support

### Base Service
- Common CRUD operations
- Input validation and sanitization
- Pagination handling
- Response formatting

## Environment Variables

The package respects various environment variables for configuration:

- `NODE_ENV`: Environment (development, production, test)
- `CACHE_DEFAULT_TTL`: Default cache TTL in seconds
- `DB_CONNECTION_TIMEOUT`: Database connection timeout
- `ENABLE_CACHING`: Enable/disable caching features
- And many more (see ConfigManager for full list)

## Testing

```bash
npm test
```

## Contributing

1. Add new utilities to appropriate directories
2. Update exports in `index.js`
3. Add documentation and examples
4. Write tests for new functionality
5. Update this README

## License

MIT
