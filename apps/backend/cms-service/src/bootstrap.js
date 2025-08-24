// src/bootstrap.js
const { Container } = require('./container');
const supabase = require('./db/initSupabase');

// Import factory functions
const { createPostRepository } = require('./repositories/postRepository');
const { createCreatePostUseCase } = require('./usecases/createPost');
const { createGetPostUseCase } = require('./usecases/getPost');

const setupContainer = () => {
  const container = new Container();

  // External dependencies
  container.register('supabase', supabase, { singleton: true });

  // Repository layer
  container.register('postRepository', (container) => {
    return createPostRepository(container.get('supabase'));
  }, { singleton: true });
  container.register('mediaRepository', (container) => {
    return createMediaRepository(container.get('supabase'));
  }, { singleton: true });

  // Use case layer
  container.register('createPostUseCase', (container) => {
    return createCreatePostUseCase(
      container.get('postRepository'),
      container.get('cloudinaryService'),
      container.get('mediaRepository')
    );
  });

  container.register('searchPostsUseCase', (container) => {
    return createSearchPostsUseCase(container.get('postRepository'));
  });

  container.register('getPostUseCase', (container) => {
    return createGetPostUseCase(container.get('postRepository'));
  });
  
  // TODO: Register other use cases here
  
  return container;
};

module.exports = { setupContainer };