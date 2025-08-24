// src/usecases/searchPosts.js
const { BadRequestError } = require('common/core/error.response');
const { validateSearchQuery } = require('../utils/search.utils');

const createSearchPostsUseCase = (postRepository) => {
    return async (query, options = {}) => {
        const validatedQuery = validateSearchQuery(query);
        // ... (phần còn lại của logic) ...
        const searchResults = await postRepository.searchByRegExp({
            patterns: searchPatterns,
            fields: searchFields,
            options: {
                caseSensitive,
                exactMatch,
                limit,
                offset
            }
        });
        // ... (phần còn lại của logic) ...
    };

};

module.exports = { createSearchPostsUseCase };
