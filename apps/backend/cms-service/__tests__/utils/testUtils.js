// __tests__/utils/testUtils.js
const { v4: uuidv4 } = require('uuid');

/**
 * Test utilities for consistent test data generation
 */

const generateTestUUID = () => {
  return uuidv4();
};

const generateTestPost = (overrides = {}) => {
  return {
    id: generateTestUUID(),
    title: 'Integration Test Post',
    content: 'This is a comprehensive test post for integration testing',
    contentType: 'html',
    isPublished: true,
    tags: ['integration', 'testing'],
    slug: 'integration-test-post',
    authorId: generateTestUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

const generateTestComment = (postId, overrides = {}) => {
  return {
    id: generateTestUUID(),
    postId: postId || generateTestUUID(),
    content: 'This is a test comment',
    authorName: 'Test User',
    authorEmail: 'test@example.com',
    createdAt: new Date().toISOString(),
    ...overrides
  };
};

const generateTestFeedback = (overrides = {}) => {
  return {
    id: generateTestUUID(),
    authorName: 'E2E Test User',
    content: 'This is test feedback content',
    rating: 5,
    isAnonymous: true,
    status: 'approved',
    createdAt: new Date().toISOString(),
    ...overrides
  };
};

const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

module.exports = {
  generateTestUUID,
  generateTestPost,
  generateTestComment,
  generateTestFeedback,
  isValidUUID
};
