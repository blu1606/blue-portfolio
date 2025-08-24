// src/usecases/searchPosts.js
const { BadRequestError } = require('common/core/error.response');
const { createUnaccentedRegexPattern, escapeRegexSpecialChars, validateSearchQuery } = require('../utils/search.utils');

/**
 * Tạo use case tìm kiếm bài viết
 * @param {Object} postRepository - Instance của Post Repository
 * @returns {Function} - Hàm tìm kiếm
 */
const createSearchPostsUseCase = (postRepository) => {
  return async (query, options = {}) => {
    try {
      // 1. Validate và chuẩn hóa input
      const validatedQuery = validateSearchQuery(query);
      const {
        limit = 20,
        offset = 0,
        searchFields = ['title', 'content'],
        caseSensitive = false
      } = options;

      // 2. Tạo patterns tìm kiếm thông minh
      let searchPatterns = [];
      const words = validatedQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      words.forEach(word => {
        const escapedWord = escapeRegexSpecialChars(word);
        const accentPattern = createUnaccentedRegexPattern(escapedWord);
        searchPatterns.push(accentPattern);
      });

      // 3. Gọi repository để tìm kiếm và đếm tổng số
      const searchResults = await postRepository.searchByRegExp({
        patterns: searchPatterns,
        fields: searchFields,
        options: { limit, offset }
      });

      const totalCount = await postRepository.countByRegExp({
        patterns: searchPatterns,
        fields: searchFields,
      });

      // 4. Trả về kết quả
      return {
        posts: searchResults,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasNext: offset + limit < totalCount,
          hasPrev: offset > 0
        },
        searchInfo: {
          originalQuery: query,
          searchFields
        },
        message: `Found ${searchResults.length} of ${totalCount} results for query: '${validatedQuery}'`
      };

    } catch (error) {
      console.error('Search use case error:', error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new Error('An error occurred during search operation');
    }
  };
};

module.exports = { createSearchPostsUseCase };