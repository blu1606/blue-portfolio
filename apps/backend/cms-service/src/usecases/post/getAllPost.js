// src/usecases/getAllPosts.js
const createGetAllPostsUseCase = (postRepository) => {
  return async (limit = 20, offset = 0) => {
    // 1. Lấy dữ liệu bài viết có phân trang
    const posts = await postRepository.getPaginatedPosts(limit, offset);

    // 2. Lấy tổng số bài viết
    const total = await postRepository.countAllPosts();
    
    // 3. Chuẩn bị dữ liệu trả về
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
  };
};

module.exports = { createGetAllPostsUseCase };