// __tests__/integration/validation.integration.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Integration: Validation System', () => {
  describe('POST /api/v1/posts - Validation Integration', () => {
    it('should validate and sanitize input correctly', async () => {
      const payload = {
        title: '  Test Post Title  ',
        content: '  This is test content with <script>alert("xss")</script> attempt  ',
        contentType: 'html'
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(payload);

      // Should sanitize and validate properly
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata.title).toBe('Test Post Title');
      expect(response.body.metadata.content).not.toContain('<script>');
    });

    it('should reject invalid schema data', async () => {
      const invalidPayload = {
        title: '', // Empty title
        content: 'Short', // Too short content
        contentType: 'invalid' // Invalid content type
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should handle file upload validation', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .field('title', 'Test Post with Files')
        .field('content', 'This is test content for file upload')
        .attach('files', Buffer.from('fake-image-data'), 'test.txt'); // Invalid file type

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Only image files');
    });
  });

  describe('POST /api/v1/feedback/anonymous - Anonymous Feedback Integration', () => {
    it('should create anonymous feedback with proper validation', async () => {
      const payload = {
        authorName: 'Test User',
        authorEmail: 'test@example.com',
        content: 'This is a valid feedback content that meets minimum length requirements',
        rating: 5
      };

      const response = await request(app)
        .post('/api/v1/feedback/anonymous')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata).toHaveProperty('id');
      expect(response.body.metadata.author_name).toBe('Test User');
      expect(response.body.metadata.is_anonymous).toBe(true);
    });

    it('should enforce rate limiting for anonymous feedback', async () => {
      const payload = {
        authorName: 'Rate Limit Test',
        content: 'Testing rate limit functionality with valid content length'
      };

      // Make multiple requests rapidly
      const requests = Array(4).fill().map(() => 
        request(app)
          .post('/api/v1/feedback/anonymous')
          .send(payload)
      );

      const responses = await Promise.all(requests);
      
      // Should allow first few but reject later ones
      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBeLessThanOrEqual(3);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Response Format Consistency', () => {
    const endpoints = [
      { method: 'get', path: '/api/v1/posts', auth: false },
      { method: 'get', path: '/api/v1/feedback', auth: false },
      { method: 'post', path: '/api/v1/posts', auth: true, body: { title: 'Test', content: 'Test content' } }
    ];

    endpoints.forEach(({ method, path, auth, body }) => {
      it(`should return consistent format for ${method.toUpperCase()} ${path}`, async () => {
        let req = request(app)[method](path);
        
        if (auth) {
          req = req.set('Authorization', 'Bearer valid-token');
        }
        
        if (body) {
          req = req.send(body);
        }

        const response = await req;

        // All responses should have consistent structure
        expect(response.body).toHaveProperty('success');
        expect(typeof response.body.success).toBe('boolean');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
        
        if (response.body.success) {
          // Success responses might have metadata
          if (response.body.metadata) {
            expect(typeof response.body.metadata).toBe('object');
          }
        }
      });
    });
  });
});

describe('Integration: Error Handling', () => {
  it('should handle database connection errors gracefully', async () => {
    // Temporarily break database connection
    const originalSupabase = require('../../src/db/initSupabase');
    
    // Mock database error
    jest.doMock('../../src/db/initSupabase', () => ({
      from: () => {
        throw new Error('Database connection failed');
      }
    }));

    const response = await request(app)
      .get('/api/v1/posts');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('server error');
  });

  it('should handle missing authentication properly', async () => {
    const response = await request(app)
      .post('/api/v1/posts')
      .send({
        title: 'Test Post',
        content: 'This should require authentication'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication');
  });
});
