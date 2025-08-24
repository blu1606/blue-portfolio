// src/usecases/getAllPosts.js
const createGetAllPostsUseCase = (postRepository) => {
  return async () => {
    const posts = await postRepository.getAll();
    return {
      posts,
      total: posts.length
    };
  };
};

module.exports = { createGetAllPostsUseCase };