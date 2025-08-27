// src/bootstrap.js
const { Container } = require('./container');
const supabase = require('./db/initSupabase');

// Import factory functions
const { createPostRepository } = require('./repositories/postRepository');
const { createMediaRepository } = require('./repositories/mediaRepository');
const { createFeedbackRepository } = require('./repositories/feedbackRepository');
const { createCommentRepository } = require('./repositories/commentRepository');
const { createTagRepository } = require('./repositories/tagRepository');
const { createPostTagRepository } = require('./repositories/postTagRepository');

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

// meilisearch usecase
const { createMeiliSearchPostsUseCase } = require('./usecases/post/meiliSearchPosts');

const { createCacheService } = require('./services/cacheService');
const { createCloudinaryService } = require('./services/cloudinaryService');
const { createTagService } = require('./services/tagService');
const { createSoftDeleteService } = require('./services/softDeleteService');
const { createPostService } = require('./services/postService');

const setupContainer = () => {
  const container = new Container();

  // External dependencies
  container.register('supabase', supabase, { singleton: true });

  // Service layer (register before repositories)
  container.register('cloudinaryService', () => {
    return createCloudinaryService();
  }, { singleton: true });
  // redis 
  container.register('redisClient', require('./configs/redis.config'), { singleton: true });
  container.register('cacheService', (container) => {
    const redisClient = container.get('redisClient');
    return createCacheService(redisClient);
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

  container.register('tagRepository', (container) => {
    return createTagRepository(container.get('supabase'));
  }, { singleton: true });

  container.register('postTagRepository', (container) => {
    return createPostTagRepository(container.get('supabase'));
  }, { singleton: true });

  // Business Services layer
  container.register('tagService', (container) => {
    return createTagService(
      container.get('tagRepository'),
      container.get('postTagRepository')
    );
  }, { singleton: true });

  container.register('softDeleteService', (container) => {
    return createSoftDeleteService(container);
  }, { singleton: true });

  container.register('postService', (container) => {
    return createPostService(
      container.get('postRepository'),
      container.get('tagService'),
      container.get('mediaRepository'),
      container.get('cloudinaryService')
    );
  }, { singleton: true });



  // Use case layer
  // createPostUseCase will be registered after rabbitmq/meili below

  container.register('searchPostsUseCase', (container) => {
    return createSearchPostsUseCase(
      container.get('postRepository'),
      container.get('cacheService')
    );
  });
  
  container.register('getPostUseCase', (container) => {
    return createGetPostUseCase(container.get('postRepository'), container.get('cacheService'));
  });

  // Post-related usecases
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
    const feedbackRepository = container.get('feedbackRepository');
    const cloudinaryService = container.get('cloudinaryService');
    return createCreateFeedbackUseCase(feedbackRepository, cloudinaryService);
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

  // rabbitMQ
  const { createRabbitMQPublisher } = require('./services/rabbitmqPubliser');
  container.register('rabbitmqPublisher', () => {
    return createRabbitMQPublisher(process.env.RABBITMQ_URL);
  }, { singleton: true });

  // meilisearch service and usecase
  const { createMeiliSearchService } = require('./services/meiliSearchService');
  container.register('meiliSearchService', () => createMeiliSearchService({
    host: process.env.MEILI_HOST,
    apiKey: process.env.MEILI_API_KEY
  }), { singleton: true });

  container.register('meiliSearchPostsUseCase', (container) => {
    return createMeiliSearchPostsUseCase(container.get('meiliSearchService'));
  });

  // createPostUseCase (depends on rabbitmqPublisher and meili usecase)
  container.register('createPostUseCase', (container) => {
    return createCreatePostUseCase(
      container.get('postRepository'),
      container.get('cloudinaryService'),
      container.get('mediaRepository'),
      container.get('cacheService'),
      container.get('rabbitmqPublisher')
    );
  });



  return container;
};

module.exports = { setupContainer };