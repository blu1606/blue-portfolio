const request = require('supertest');
const { setupContainer } = require('./src/bootstrap');
const { createPostController } = require('./src/controllers/postController');

// Simple test for search posts
const app = require('./src/app');

async function testSearch() {
    const response = await request(app)
        .get('/api/v1/posts/search?query=test')
        .expect(200);
        
    console.log('Response body:', JSON.stringify(response.body, null, 2));
}

testSearch().catch(console.error);
