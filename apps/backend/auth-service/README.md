# Auth Service

Authentication microservice for personal portfolio website.

## Features

- **User Registration & Login**: Secure user authentication with JWT
- **Password Management**: Password reset via OTP, password change
- **Email Verification**: Email verification system
- **User Profiles**: Profile management with avatar upload
- **Avatar Upload**: Cloudinary integration for image upload and optimization
- **Security**: Rate limiting, CORS, helmet, validation
- **Health Monitoring**: Health checks and metrics endpoints
- **API Documentation**: Swagger/OpenAPI documentation
- **Performance**: Request timing and memory monitoring

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

4. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout (protected)
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Password Management
- `POST /api/v1/auth/request-otp` - Request password reset OTP
- `POST /api/v1/auth/validate-otp` - Validate OTP
- `POST /api/v1/auth/reset-password` - Reset password with OTP
- `POST /api/v1/auth/change-password` - Change password (protected)

### Email Verification
- `GET /api/v1/auth/verify-email/:token` - Verify email address
- `POST /api/v1/auth/resend-verification` - Resend verification email

### User Profile
- `GET /api/v1/auth/me` - Get current user profile (protected)
- `PUT /api/v1/auth/profile` - Update user profile with avatar (protected)

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/v1/health` - Detailed health check
- `GET /api/v1/metrics` - System metrics

### Documentation
- `GET /api-docs` - Swagger API documentation

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Architecture

The service follows Clean Architecture principles with:
- **Controllers**: Handle HTTP requests/responses
- **Use Cases**: Business logic implementation
- **Services**: External service integrations
- **Repositories**: Data access layer
- **Middleware**: Cross-cutting concerns
- **Dependency Injection**: Service container pattern

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Email and password validation
- OTP-based password reset
- Account lockout protection
- Security headers with helmet
- CORS configuration

## Environment Variables

See `.env.example` for all required environment variables.

## Error Handling

The service uses consistent error responses following the common package standards:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Response Format

Successful responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "metadata": {
    // Response data
  }
}
```
