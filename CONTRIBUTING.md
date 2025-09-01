# Contributing to Blue Portfolio

Thank you for your interest in contributing to Blue Portfolio! This guide will help you understand our development process, architecture decisions, and coding standards.

## 🏗️ Architecture Overview

Blue Portfolio follows **Clean Architecture** principles with a **microservices** approach:

### Service Structure
```
apps/backend/
├── cms-service/        # Content management
├── auth-service/       # Authentication  
└── ai-service/         # AI integration (planned)
```

### Layer Separation
Each service follows strict layer separation:
```
Controllers → Use Cases → Repositories → Database
     ↓           ↓            ↓
  HTTP        Business     Data Access
 Handlers      Logic        Layer
```

## 🚀 Development Setup

### Prerequisites
- **Node.js**: v22+ (LTS)
- **Git**: Latest version
- **Docker**: Optional, for local services
- **Redis, MeiliSearch, Supabase**: External services (see .env.example)

### Initial Setup
```bash
# Clone repository
git clone https://github.com/blu1606/blue-portfolio.git
cd blue-portfolio

# Install shared dependencies
cd packages/common && npm install

# Setup services
cd ../../apps/backend/cms-service
npm install
cp .env.example .env
# Update .env with your credentials

cd ../auth-service  
npm install
cp .env.example .env
# Update .env with your credentials
```

### Starting Development Services
```bash
# Terminal 1: CMS Service
cd apps/backend/cms-service
npm run dev

# Terminal 2: Auth Service  
cd apps/backend/auth-service
npm run dev
```

## 🧪 Testing Guidelines

### Test Categories
1. **Unit Tests**: Business logic in isolation
2. **Integration Tests**: Service interactions
3. **API Tests**: HTTP endpoint testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific categories
npm test -- --testPathPattern="unit"
npm test -- --testPathPattern="api"
npm test -- --testPathPattern="integration"

# Run with coverage
npm run test:coverage
```

### Writing Tests
```javascript
// Unit test example
describe('CreatePostUseCase', () => {
  it('should create post with valid data', async () => {
    // Arrange
    const mockRepository = { create: jest.fn() };
    const useCase = createCreatePostUseCase(mockRepository);
    
    // Act & Assert
    await expect(useCase.execute(validData)).resolves.toEqual(expectedResult);
  });
});

// API test example  
describe('POST /api/v1/posts', () => {
  it('should create post successfully', async () => {
    const response = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', 'Bearer valid-token')
      .send(postData);
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## 🔧 Coding Standards

### File Naming Conventions
- **Files**: kebab-case (`create-post.usecase.js`)
- **Directories**: kebab-case (`use-cases/`)
- **Functions**: camelCase (`createPost`)
- **Classes**: PascalCase (`PostRepository`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Code Organization

#### Use Cases (Business Logic)
```javascript
// usecases/post/createPost.js
const createCreatePostUseCase = (postRepository, fileService) => {
  return {
    async execute(data) {
      // 1. Validate input
      // 2. Apply business rules
      // 3. Call repository
      // 4. Return structured response
      return { post: createdPost };
    }
  };
};
```

#### Repositories (Data Access)
```javascript
// repositories/postRepository.js
const createPostRepository = (supabaseClient) => {
  return {
    async create(postData) {
      const { data, error } = await supabaseClient
        .from('posts')
        .insert(postData);
      
      if (error) throw new DatabaseError(error.message);
      return data[0];
    }
  };
};
```

#### Controllers (HTTP Handlers)
```javascript
// controllers/postController.js
const createPost = asyncHandler(async (req, res) => {
  const createPostUseCase = req.container.get('createPostUseCase');
  const result = await createPostUseCase.execute(req.body);
  
  res.status(201).json(new SuccessResponse(result));
});
```

### Error Handling
```javascript
// Use standardized error classes
throw new BadRequestError('Invalid input data');
throw new NotFoundError('Post not found');
throw new InternalServerError('Database connection failed');

// Controllers use asyncHandler for automatic error catching
const getPost = asyncHandler(async (req, res) => {
  // Business logic here
  // Errors automatically caught and handled
});
```

### Dependency Injection
```javascript
// bootstrap.js - Registration order matters
container.register('supabase', supabaseClient, { singleton: true });

container.register('postRepository', (container) => {
  return createPostRepository(container.get('supabase'));
}, { singleton: true });

container.register('createPostUseCase', (container) => {
  return createCreatePostUseCase(container.get('postRepository'));
});
```

## 📚 API Documentation

### Swagger/OpenAPI Standards
- Document ALL endpoints with complete schemas
- Include request/response examples
- Specify authentication requirements
- Use semantic HTTP status codes

```javascript
// swagger.config.js example
const postSchema = {
  type: 'object',
  required: ['title', 'content'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    content: { type: 'string', minLength: 1 }
  }
};
```

### Response Formats
```javascript
// Success responses
new SuccessResponse({
  metadata: data,
  message: "Operation successful"
});

// Error responses (handled by middleware)
{
  success: false,
  message: "Error description"
}
```

## 🔍 Connection Testing

### Automated Testing
Services automatically test external dependencies on startup. No manual intervention needed.

### Adding New Service Dependencies
```javascript
// Add to ConnectionTestService
async testNewService() {
  try {
    // Test connection logic
    return { success: true, service: 'ServiceName' };
  } catch (error) {
    return { success: false, service: 'ServiceName', error: error.message };
  }
}
```

## 🛠️ Development Workflow

### Branch Strategy
- **main**: Production-ready code
- **feature/feature-name**: New features
- **fix/bug-description**: Bug fixes
- **docs/update-description**: Documentation updates

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add automated connection testing
fix: resolve import path issues in routes
docs: update API documentation
test: add unit tests for post creation
refactor: improve error handling in repositories
```

### Pull Request Process
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Implement Changes**: Follow coding standards
3. **Write Tests**: Ensure test coverage
4. **Update Documentation**: API docs, README if needed
5. **Test Locally**: Run all tests and verify connections
6. **Create PR**: With clear description and test results

### Code Review Checklist
- [ ] Follows Clean Architecture principles
- [ ] Includes comprehensive tests
- [ ] Updates API documentation
- [ ] Handles errors properly
- [ ] Uses dependency injection correctly
- [ ] Follows naming conventions
- [ ] No console.log statements in production code

## 🚨 Common Patterns

### Database Operations
```javascript
// Always use repositories
const posts = await postRepository.findAll({ limit, offset });

// Handle errors consistently  
try {
  return await repository.operation();
} catch (error) {
  throw new DatabaseError(`Operation failed: ${error.message}`);
}
```

### Validation
```javascript
// Use middleware for validation
router.post('/', validateCreatePost, controller.createPost);

// Schema-based validation
const createPostSchema = {
  type: 'object',
  required: ['title', 'content'],
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: 'string', minLength: 1 }
  }
};
```

### Authentication
```javascript
// Protected routes
router.use(authenticationMiddleware);
router.post('/', requireRole(['admin']), controller.createPost);

// Access user in controllers
const userId = req.user.id;
```

## 🐛 Debugging

### Connection Issues
Services automatically test connections on startup. Check startup logs for connection status.

### Database Issues
```javascript
// Enable query logging in development
console.log('Query:', query);
console.log('Parameters:', params);
```

### Test Debugging
```javascript
// Use --verbose for detailed test output
npm test -- --verbose

// Run specific test file
npm test -- createPost.test.js
```

## 📦 Package Management

### Adding Dependencies
```bash
# Service-specific dependency
cd apps/backend/cms-service
npm install package-name

# Shared dependency (use sparingly)
cd packages/common
npm install package-name
```

### Updating Common Package
```bash
cd packages/common
npm version patch

# Update in services
cd ../../apps/backend/cms-service
npm install
```

## 🚀 Performance Guidelines

### Caching Strategy
```javascript
// Use Redis for frequently accessed data
const cached = await cacheService.get(key);
if (cached) return cached;

const data = await repository.getData();
await cacheService.set(key, data, TTL);
return data;
```

### Database Optimization
- Use proper indexes
- Implement pagination
- Avoid N+1 queries
- Use connection pooling

### Memory Management
- Clean up event listeners
- Close database connections
- Handle memory-intensive operations carefully

## 🤝 Getting Help

### Documentation
- **API Docs**: http://localhost:3001/api-docs
- **Architecture**: See README files in each service
- **Examples**: Check existing code patterns

### Community
- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions

---

Thank you for contributing to Blue Portfolio! Together we're building something amazing. 🚀
