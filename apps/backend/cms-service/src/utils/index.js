// src/utils/index.js
const { createLogger: createCommonLogger } = require('common/utils/logger');

const CommonUtils = {
  slugify: (text = '') => {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
};

const createLogger = (name) => createCommonLogger(name);

module.exports = { CommonUtils, createLogger };
