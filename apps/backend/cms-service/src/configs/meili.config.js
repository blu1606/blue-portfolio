// src/configs/meili.config.js
// Centralized Meilisearch configuration
module.exports = {
  host: process.env.MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILI_API_KEY || ''
};
