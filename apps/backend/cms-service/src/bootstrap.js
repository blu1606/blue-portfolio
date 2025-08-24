// src/bootstrap.js
const { Container } = require('./container');
const supabase = require('./db/initSupabase');

// Import factory functions
const { createPostRepository } = require('./repositories/postRepository');
const { createMediaRepository } = require('./repositories/mediaRepository');
const { createFeedbackRepository } = require('./repositories/feedbackRepository');
const { createCommentRepository } = require('./repositories/commentRepository');

const { createCreatePostUseCase } = require('./usecases/post/createPost');
const { createDeletePostUseCase } = require('./usecases/post/deletePost');
const { createGetAllPostsUseCase } = require('./usecases/post/getAllPost');
const { createGetPostUseCase } = require('./usecases/post/getPost');
const { createSearchPostsUseCase } = require('./usecases/post/searchPosts');
const { createUpdatePostUseCase } = require('./usecases/post/updatePost');

const { createCreateFeedbackUseCase } = require('./usecases/feedback/createFeedback');
const { createGetFeedbacksUseCase } = require('./usecases/feedback/getFeedback');
const { createApproveFeedbackUseCase } = require('./usecases/feedback/approveFeedback');
const { createGetAllFeedbacksUseCase } = require('./usecases/feedback/getAllFeedback');

const { createCreateCommentUseCase } = require('./usecases/comment/createComment');
const { createGetCommentsByPostUseCase } = require('./usecases/comment/getCommentsByPost');

const { createCacheService } = require('./services/cacheService');
const { createCloudinaryService } = require('./services/cloudinaryService');

const setupContainer = () => {
  const container = new Container();

  // External dependencies
  container.register('supabase', supabase, { singleton: true });

  // Service layer (register before repositories)
  container.register('cloudinaryService', () => {
    return createCloudinaryService();
  }, { singleton: true });

  container.register('cacheService', (container) => {
    // For now, return a mock cache service since Redis config is missing
    return {
      get: async (key) => null,
      set: async (key, value, ttl) => {},
      del: async (key) => {},
      setex: async (key, ttl, value) => {}
    };
  }, { singleton: true });

  // Repository layer
  container.register('postRepository', (container) => {
    return createPostRepository(container.get('supabase'));
  }, { singleton: true });
  
  container.register('mediaRepository', (container) => {
    return createMediaRepository(container.get('supabase'));
  }, { singleton: true });
  
  container.register('feedbackRepository', (container) => {
    return createFeedbackRepository(container.get('supabase'));
  }, { singleton: true });
  
  container.register('commentRepository', (container) => {
    return createCommentRepository(container.get('supabase'));
  }, { singleton: true });



  // Use case layer
  container.register('createPostUseCase', (container) => {
    return createCreatePostUseCase(
      container.get('postRepository'),
      container.get('cloudinaryService'),
      container.get('mediaRepository'),
      container.get('cacheService')
    );
  });

  container.register('searchPostsUseCase', (container) => {
    return createSearchPostsUseCase(
      container.get('postRepository'),
      container.get('cacheService')
    );
  });
  
  container.register('getPostUseCase', (container) => {
    return createGetPostUseCase(container.get('postRepository'), container.get('cacheService'));
  });

  container.register('updatePostUseCase', (container) => {
    return createUpdatePostUseCase(container.get('postRepository'), container.get('cacheService'));
  });

  container.register('deletePostUseCase', (container) => {
    return createDeletePostUseCase(container.get('postRepository'), container.get('cacheService'));
  });
  
  container.register('getAllPostsUseCase', (container) => {
    return createGetAllPostsUseCase(container.get('postRepository'), container.get('cacheService'));
  });
  
  // feedback usecase
  container.register('createFeedbackUseCase', (container) => {
    return createCreateFeedbackUseCase(container.get('feedbackRepository'));
  });
  container.register('getFeedbacksUseCase', (container) => {
    return createGetFeedbacksUseCase(container.get('feedbackRepository'));
  });
  container.register('approveFeedbackUseCase', (container) => {
    return createApproveFeedbackUseCase(container.get('feedbackRepository'));
  });
  container.register('getAllFeedbacksUseCase', (container) => {
    return createGetAllFeedbacksUseCase(container.get('feedbackRepository'));
  });
  
  // comment usecase
  container.register('createCommentUseCase', (container) => {
    return createCreateCommentUseCase(
      container.get('commentRepository'),
      container.get('postRepository') // Comment cần biết về Post
    );
  });
  container.register('getCommentsByPostUseCase', (container) => {
    return createGetCommentsByPostUseCase(container.get('commentRepository'));
  });

  return container;
};

module.exports = { setupContainer };