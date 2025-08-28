// __tests__/integration/performance.integration.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Integration: Performance Tests', () => {
  describe('Response Time Tests', () => {
    it('should respond to GET /api/v1/posts within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/posts');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app).get('/api/v1/posts')
      );
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(500); // 500ms average
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make multiple requests
      for (let i = 0; i < 50; i++) {
        await request(app).get('/api/v1/posts');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle large pagination offsets efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/posts?limit=20&offset=1000');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should handle large offsets within 2 seconds
    });

    it('should return consistent pagination metadata', async () => {
      const response = await request(app)
        .get('/api/v1/posts?limit=5&offset=10');
      
      expect(response.status).toBe(200);
      expect(response.body.metadata).toHaveProperty('data');
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('limit');
      expect(response.body.metadata).toHaveProperty('offset');
      expect(response.body.metadata).toHaveProperty('hasMore');
      
      expect(response.body.metadata.limit).toBe(5);
      expect(response.body.metadata.offset).toBe(10);
      expect(Array.isArray(response.body.metadata.data)).toBe(true);
    });
  });

  describe('File Upload Performance', () => {
    it('should handle multiple file uploads efficiently', async () => {
      const startTime = Date.now();
      
      // Create fake image buffers
      const imageBuffer1 = Buffer.alloc(1024 * 100); // 100KB
      const imageBuffer2 = Buffer.alloc(1024 * 100); // 100KB
      
      const response = await request(app)
        .post('/api/v1/feedback/anonymous')
        .set('Authorization', 'Bearer valid-token')
        .field('authorName', 'Performance Test User')
        .field('content', 'Testing file upload performance with multiple images')
        .attach('avatar', imageBuffer1, 'avatar.jpg')
        .attach('images', imageBuffer2, 'image1.jpg');
      
      const responseTime = Date.now() - startTime;
      
      // Should handle file uploads within reasonable time
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Database Query Performance', () => {
    it('should execute complex queries efficiently', async () => {
      const startTime = Date.now();
      
      // Test search functionality which involves complex queries
      const response = await request(app)
        .get('/api/v1/posts/search?query=test&limit=10');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Search should complete within 3 seconds
    });
  });
});
