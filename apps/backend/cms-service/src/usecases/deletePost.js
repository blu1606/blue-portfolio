// src/usecases/deletePost.js
const { BadRequestError, NotFoundError, ForbiddenError } = require('common/core/error.response');

const createDeletePostUseCase = (postRepository) => {
  return async (postId, authorId) => {
    // 1. Kiểm tra đầu vào
    if (!postId || !authorId) {
      throw new BadRequestError('Post ID and author ID are required.');
    }

    // 2. Tìm bài viết và kiểm tra quyền tác giả
    const existingPost = await postRepository.findById(postId);
    if (!existingPost) {
      throw new NotFoundError('Post not found.');
    }

    if (existingPost.author_id !== authorId) {
      throw new ForbiddenError('You do not have permission to delete this post.');
    }

    // 3. Gọi repository để xóa
    await postRepository.remove(postId);
    
    return {
      message: 'Post deleted successfully!'
    };
  };
};

module.exports = { createDeletePostUseCase };