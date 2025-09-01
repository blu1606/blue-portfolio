# Blue Portfolio - Microservices Platform

A modern portfolio platform built with microservices architecture, featuring automated connection testing, comprehensive API documentation, and production-ready deployment configurations.

## 🏗️ Architecture Overview

```
blue-portfolio/
├── apps/
│   ├── backend/
│   │   ├── cms-service/     # Content Management API ✅
│   │   ├── auth-service/    # Authentication Service ✅  
│   │   └── ai-service/      # AI Integration Service 🚧
│   └── frontend/            # React SPA 🚧
├── packages/
│   └── common/              # Shared utilities & middleware ✅
└── k8s/                     # Kubernetes deployment configs ✅
```

## 🚀 Services Status

| Service | Status | Description | Port |
|---------|--------|-------------|------|
| **CMS Service** | ✅ Production Ready | Content management with automated testing | 3001 |
| **Auth Service** | ✅ Production Ready | JWT authentication & user management | 3002 |
| **AI Service** | 🚧 In Development | AI integration and processing | 3003 |
| **Frontend** | 🚧 In Development | React SPA with modern UI | 3000 |

## 🛠️ Tech Stack

### Backend Services
- **Runtime**: Node.js v22+
- **Framework**: Express.js
- **Architecture**: Clean Architecture with DI Container
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis Cloud
- **Search**: MeiliSearch
- **File Storage**: Cloudinary
- **Message Queue**: RabbitMQ
- **Testing**: Jest, Supertest

### Frontend (Planned)
- **Framework**: React 18+
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Build Tool**: Vite
- **Testing**: Vitest, Testing Library

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Documentation**: Swagger/OpenAPI 3.0

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- Docker (optional)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/blu1606/blue-portfolio.git
cd blue-portfolio
```

### 2. Install Dependencies
```bash
# Install shared packages
cd packages/common && npm install

# Install CMS service
cd ../../apps/backend/cms-service && npm install

# Install Auth service  
cd ../auth-service && npm install
```

### 3. Environment Setup
```bash
# CMS Service
cd apps/backend/cms-service
cp .env.example .env
# Update .env with your credentials

# Auth Service
cd ../auth-service  
cp .env.example .env
# Update .env with your credentials
```

### 4. Start Services

#### CMS Service (Port 3001)
```bash
cd apps/backend/cms-service
npm start
```

**Automated Connection Testing Output:**
```
🔍 CMS Service - Connection Health Check
=========================================
✅ Redis connection established
✅ MeiliSearch is healthy  
✅ Supabase connection successful
🎉 All services connected successfully!
```

#### Auth Service (Port 3002)
```bash
cd apps/backend/auth-service
npm start
```

## 📚 API Documentation

### Interactive Documentation
- **CMS Service**: http://localhost:3001/api-docs
- **Auth Service**: http://localhost:3002/api-docs

### Health Checks
```bash
# CMS Service
curl http://localhost:3001/api/v1/health

# Auth Service  
curl http://localhost:3002/api/v1/health
```

## 🧪 Testing

### Run All Tests
```bash
# CMS Service
cd apps/backend/cms-service
npm test

# Auth Service
cd apps/backend/auth-service  
npm test
```

### Test Categories
```bash
# Unit tests only
npm test -- --testPathPattern="unit"

# API integration tests
npm test -- --testPathPattern="api" 

# Coverage report
npm run test:coverage
```

## 🏗️ Development Workflows

### Clean Architecture Pattern
Each service follows strict layer separation:

1. **Routes** → **Controllers** → **Use Cases** → **Repositories** → **Database**
2. **Middleware stack**: Security → Validation → Authentication → Authorization → Business Logic
3. **Shared utilities** in `packages/common` for cross-service consistency

### Dependency Injection Container
```javascript
// Proper registration order in bootstrap.js
container.register('postRepository', (container) => {
  return createPostRepository(container.get('supabase'));
}, { singleton: true });

container.register('createPostUseCase', (container) => {
  return createCreatePostUseCase(container.get('postRepository'));
});
```

## 🔍 Connection Testing

### Automated Testing
Services automatically test all external dependencies on startup:

- **Redis Cloud**: Connection and basic operations
- **MeiliSearch**: Health and version endpoints  
- **Supabase**: API connectivity and authentication
- **Cloudinary**: File upload capabilities

### Manual Testing
Connection testing is integrated into service startup - no separate scripts needed.

## 🐳 Deployment

### Docker Containers
Each service includes Dockerfiles for containerization.

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/
```

### Environment Configurations
- **Development**: Local with .env files
- **Production**: Environment variables via Kubernetes secrets

## 📊 Service Features

### CMS Service
- ✅ RESTful API for content management
- ✅ File upload with Cloudinary
- ✅ Full-text search with MeiliSearch
- ✅ Redis caching for performance
- ✅ Comprehensive API documentation
- ✅ Automated connection testing

### Auth Service  
- ✅ JWT authentication
- ✅ User registration and management
- ✅ Password reset with OTP
- ✅ Email verification
- ✅ Role-based access control
- ✅ Comprehensive test coverage

### Shared Common Package
- ✅ Standardized error handling
- ✅ Validation middleware
- ✅ Authentication middleware
- ✅ Logging utilities
- ✅ Database helpers

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Input Validation**: JSON Schema validation
- **Rate Limiting**: API abuse prevention
- **CORS Configuration**: Secure cross-origin requests
- **Security Headers**: Helmet middleware
- **Data Sanitization**: XSS protection

## 🤝 Contributing

1. **Architecture**: Follow Clean Architecture principles
2. **Testing**: Write comprehensive tests for new features
3. **Documentation**: Update API docs and README files
4. **Code Style**: Follow established patterns and conventions
5. **Dependencies**: Use the DI container for service dependencies

## 📝 Recent Updates

### ✅ Completed (September 2025)
- Automated connection testing for all services
- Comprehensive API documentation with Swagger
- Clean workspace organization (removed unnecessary files)
- Production-ready error handling and validation
- Performance monitoring and optimization

### 🚧 In Progress
- AI Service development
- Frontend React application
- Enhanced deployment automation

## 📄 License

This project is licensed under the MIT License.

---

**Blue Portfolio** - Building the future of portfolio platforms with microservices excellence 🚀