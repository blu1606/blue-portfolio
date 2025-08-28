// __tests__/integration/e2e.integration.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Integration: End-to-End Workflows', () => {
  describe('Complete Post Lifecycle', () => {
    let createdPostId;
    let createdPostSlug;

    it('should create a post successfully', async () => {
      const postData = {
        title: 'Integration Test Post',
        content: 'This is a comprehensive test post for integration testing',
        contentType: 'html',
        isPublished: true,
        tags: ['integration', 'testing']
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(postData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata).toHaveProperty('id');
      expect(response.body.metadata).toHaveProperty('slug');
      expect(response.body.metadata.title).toBe(postData.title);

      createdPostId = response.body.metadata.id;
      createdPostSlug = response.body.metadata.slug;
    });

    it('should retrieve the created post by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${createdPostId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata.post.id).toBe(createdPostId);
      expect(response.body.metadata.post.title).toBe('Integration Test Post');
    });

    it('should retrieve the created post by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/slug/${createdPostSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata.post.slug).toBe(createdPostSlug);
    });

    it('should update the post', async () => {
      const updateData = {
        title: 'Updated Integration Test Post',
        content: 'This content has been updated during integration testing'
      };

      const response = await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata.post.title).toBe(updateData.title);
    });

    it('should add comments to the post', async () => {
      const commentData = {
        postId: createdPostId,
        content: 'This is a test comment for integration testing'
      };

      const response = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', 'Bearer valid-token')
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata.content).toBe(commentData.content);
    });

    it('should retrieve comments for the post', async () => {
      const response = await request(app)
        .get(`/api/v1/comments?postId=${createdPostId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.metadata)).toBe(true);
      expect(response.body.metadata.length).toBeGreaterThan(0);
    });

    it('should search for the created post', async () => {
      const response = await request(app)
        .get('/api/v1/posts/search?query=Integration');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata.data.length).toBeGreaterThan(0);
      
      const foundPost = response.body.metadata.data.find(post => post.id === createdPostId);
      expect(foundPost).toBeDefined();
    });

    it('should delete the post', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for deleted post', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${createdPostId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Complete Feedback Lifecycle', () => {
    let createdFeedbackId;

    it('should create anonymous feedback with file upload', async () => {
      const imageBuffer = Buffer.alloc(1024 * 50); // 50KB fake image
      
      const response = await request(app)
        .post('/api/v1/feedback/anonymous')
        .field('authorName', 'E2E Test User')
        .field('authorEmail', 'e2e@test.com')
        .field('content', 'This is end-to-end testing feedback with file upload functionality')
        .field('rating', '5')
        .attach('avatar', imageBuffer, 'avatar.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata.is_anonymous).toBe(true);
      expect(response.body.metadata.author_name).toBe('E2E Test User');

      createdFeedbackId = response.body.metadata.id;
    });

    it('should retrieve the feedback in approved list', async () => {
      const response = await request(app)
        .get('/api/v1/feedback');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const feedbacks = response.body.metadata;
      const createdFeedback = feedbacks.find(f => f.id === createdFeedbackId);
      expect(createdFeedback).toBeDefined();
    });

    it('should allow admin to approve/manage feedback', async () => {
      const response = await request(app)
        .get('/api/v1/feedback/admin')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.metadata)).toBe(true);
    });
  });

  describe('Authentication and Authorization Flow', () => {
    it('should handle authentication workflow correctly', async () => {
      // Test public endpoints (no auth required)
      const publicResponse = await request(app)
        .get('/api/v1/posts');
      expect(publicResponse.status).toBe(200);

      // Test protected endpoints (auth required)
      const protectedResponse = await request(app)
        .post('/api/v1/posts')
        .send({
          title: 'Auth Test',
          content: 'Testing authentication'
        });
      expect(protectedResponse.status).toBe(401);

      // Test with valid token
      const authResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Auth Test Success',
          content: 'Testing authentication with valid token'
        });
      expect(authResponse.status).toBe(201);
    });

    it('should handle admin authorization correctly', async () => {
      // Test admin endpoint with regular user token
      const userResponse = await request(app)
        .get('/api/v1/feedback/admin')
        .set('Authorization', 'Bearer valid-token');
      expect(userResponse.status).toBe(403);

      // Test admin endpoint with admin token
      const adminResponse = await request(app)
        .get('/api/v1/feedback/admin')
        .set('Authorization', 'Bearer admin-token');
      expect(adminResponse.status).toBe(200);
    });
  });
});
