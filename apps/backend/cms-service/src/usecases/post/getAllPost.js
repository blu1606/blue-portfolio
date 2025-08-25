// src/usecases/getAllPosts.js
const createGetAllPostsUseCase = (postRepository, cacheService) => {
  return async (limit = 20, offset = 0) => {
    const cacheKey = `posts:all:limit=${limit}:offset=${offset}`;
    const cachedData = await cacheService.getWithStale(cacheKey, async () => {
      // 1. Lấy dữ liệu bài viết có phân trang
      const posts = await postRepository.getPaginatedPosts(limit, offset);
      // 2. Lấy tổng số bài viết
      const total = await postRepository.countAllPosts();
      return { posts, total };
    });
    
    if (!cachedData) {
      // Fallback in case of rebuildFn returns null
      const posts = await postRepository.getPaginatedPosts(limit, offset);
      const total = await postRepository.countAllPosts();
      return {
          posts,
          pagination: {
              total,
              limit,
              offset,
              hasNext: offset + limit < total,
              hasPrev: offset > 0
          }
      };
    }

    // 3. Chuẩn bị dữ liệu trả về
    return {
      posts: cachedData.posts,
      pagination: {
        total: cachedData.total,
        limit,
        offset,
        hasNext: offset + limit < cachedData.total,
        hasPrev: offset > 0
      }
    };
  };
};

module.exports = { createGetAllPostsUseCase };