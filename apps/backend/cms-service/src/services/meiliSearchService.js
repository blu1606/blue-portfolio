// src/services/meiliSearchService.js
const { MeiliSearch } = require('meilisearch');
const { BadRequestError } = require('common/core/error.response');
const { createLogger } = require('common/utils/logger');
const Logger = createLogger('MeiliSearchService');

// Accept an optional config so callers (bootstrap) can pass host/apiKey explicitly
const createMeiliSearchService = (config = {}) => {
    const meili = new MeiliSearch({
        host: config.host || process.env.MEILI_HOST,
        apiKey: config.apiKey || process.env.MEILI_API_KEY
    });
    const index = meili.index('posts');

    const search = async (query, options = {}) => {
        const { limit, offset } = options;
        try {
            const results = await index.search(query, {
                limit,
                offset,
                attributesToRetrieve: ['id', 'title', 'slug', 'content_html', 'created_at']
            });
            return {
                hits: results.hits,
                query: results.query,
                totalHits: results.estimatedTotalHits
            };
        } catch (error) {
            Logger.error('Meilisearch search error', { 
                error: error.message, 
                query, 
                options 
            });
            throw new BadRequestError('Failed to perform search.');
        }
    };

    const getHealth = async () => {
        try {
            const response = await fetch(`${config.host || process.env.MEILI_HOST}/health`);
            if (response.ok) {
                const health = await response.json();
                return health;
            } else {
                throw new Error(`Health check failed with status: ${response.status}`);
            }
        } catch (error) {
            Logger.error('MeiliSearch health check failed', { error: error.message });
            throw error;
        }
    };

    const getVersion = async () => {
        try {
            const response = await fetch(`${config.host || process.env.MEILI_HOST}/version`);
            if (response.ok) {
                const version = await response.json();
                return version;
            } else {
                throw new Error(`Version check failed with status: ${response.status}`);
            }
        } catch (error) {
            Logger.error('MeiliSearch version check failed', { error: error.message });
            throw error;
        }
    };

    return { search, getHealth, getVersion };
};

module.exports = { createMeiliSearchService };