// src/routes/tagRoutes.js
const express = require('express');
const router = express.Router();

const { tagController } = require('../container');

// Public routes
router.get('/', tagController.getTags.bind(tagController));
router.get('/search', tagController.searchTags.bind(tagController));
router.get('/:tagId', tagController.getTagById.bind(tagController));

// Admin routes (placeholder - authentication middleware needed)
router.post('/', tagController.createTag.bind(tagController));
router.put('/:tagId', tagController.updateTag.bind(tagController));
router.delete('/:tagId', tagController.deleteTag.bind(tagController));

module.exports = router;
