// src/usecases/post/meiliSearchPosts.js
const { BadRequestError } = require('common/core/error.response');

const createMeiliSearchPostsUseCase = (meiliSearchService) => {
    return async (query, options = {}) => {
        if (!query || query.length < 2) {
            throw new BadRequestError('Search query must be at least 2 characters long.');
        }
        if (options.limit && (isNaN(options.limit) || options.limit <= 0)) {
            throw new BadRequestError('Limit must be a positive number.');
        }
        if (options.offset && (isNaN(options.offset) || options.offset < 0)) {
            throw new BadRequestError('Offset must be a non-negative number.');
        }

        const searchResults = await meiliSearchService.search(query, options);

        return {
            posts: searchResults.hits,
            pagination: {
                total: searchResults.totalHits,
                limit: options.limit,
                offset: options.offset
            },
            searchInfo: {
                originalQuery: query
            },
            message: `Found ${searchResults.hits.length} of ${searchResults.totalHits} results.`
        };
    };
};

module.exports = { createMeiliSearchPostsUseCase };