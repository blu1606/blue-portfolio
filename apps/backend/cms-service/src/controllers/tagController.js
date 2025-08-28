// src/controllers/tagController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { createLogger } = require('common/utils/logger');
const { ResponseHelper } = require('../utils/responseHelper');
const Logger = createLogger('TagController');

const createTagController = (container) => {
    return {
        getTags: asyncHandler(async (req, res) => {
            try {
                const tagService = container.get('tagService');
                const tags = await tagService.getAllActiveTags();
                
                return ResponseHelper.success(res, tags, 'Tags retrieved successfully');
            } catch (error) {
                Logger.error('Error getting tags', { error: error.message, stack: error.stack });
                return ResponseHelper.error(res, 'Failed to retrieve tags', 500);
            }
        }),

        getTagById: asyncHandler(async (req, res) => {
            try {
                const { tagId } = req.params;
                const tagService = container.get('tagService');
                const tag = await tagService.getTagById(tagId);
                
                if (!tag) {
                    return ResponseHelper.error(res, 'Tag not found', 404);
                }
                
                return ResponseHelper.success(res, tag, 'Tag retrieved successfully');
            } catch (error) {
                Logger.error('Error getting tag', { error: error.message, stack: error.stack });
                return ResponseHelper.error(res, 'Failed to retrieve tag', 500);
            }
        }),

        searchTags: asyncHandler(async (req, res) => {
            try {
                const { q } = req.query;
                
                if (!q || q.trim().length === 0) {
                    return ResponseHelper.error(res, 'Search query is required', 400);
                }
                
                const tagService = container.get('tagService');
                const tags = await tagService.searchTags(q.trim());
                
                return ResponseHelper.success(res, tags, 'Search completed successfully');
            } catch (error) {
                Logger.error('Error searching tags', { error: error.message, stack: error.stack });
                return ResponseHelper.error(res, 'Failed to search tags', 500);
            }
        }),

        createTag: asyncHandler(async (req, res) => {
            try {
                const { name, description, color } = req.body;
                
                if (!name || name.trim().length === 0) {
                    return ResponseHelper.error(res, 'Tag name is required', 400);
                }
                
                const tagService = container.get('tagService');
                const tag = await tagService.createTag({
                    name: name.trim(),
                    description: description?.trim(),
                    color: color || '#3b82f6'
                });
                
                return ResponseHelper.success(res, tag, 'Tag created successfully', 201);
            } catch (error) {
                Logger.error('Error creating tag', { error: error.message, stack: error.stack });
                if (error.message.includes('already exists')) {
                    return ResponseHelper.error(res, 'Tag already exists', 400);
                }
                return ResponseHelper.error(res, 'Failed to create tag', 500);
            }
        }),

        updateTag: asyncHandler(async (req, res) => {
            try {
                const { tagId } = req.params;
                const { name, description, color, is_active } = req.body;
                
                const tagService = container.get('tagService');
                const tag = await tagService.updateTag(tagId, {
                    name: name?.trim(),
                    description: description?.trim(),
                    color,
                    is_active
                });
                
                if (!tag) {
                    return ResponseHelper.error(res, 'Tag not found', 404);
                }
                
                return ResponseHelper.success(res, tag, 'Tag updated successfully');
            } catch (error) {
                Logger.error('Error updating tag', { error: error.message, stack: error.stack });
                return ResponseHelper.error(res, 'Failed to update tag', 500);
            }
        }),

        deleteTag: asyncHandler(async (req, res) => {
            try {
                const { tagId } = req.params;
                
                const tagService = container.get('tagService');
                const result = await tagService.deleteTag(tagId);
                
                if (!result) {
                    return ResponseHelper.error(res, 'Tag not found', 404);
                }
                
                if (result.error) {
                    return ResponseHelper.error(res, result.error, 400);
                }
                
                return ResponseHelper.success(res, null, 'Tag deleted successfully');
            } catch (error) {
                Logger.error('Error deleting tag', { error: error.message, stack: error.stack });
                return ResponseHelper.error(res, 'Failed to delete tag', 500);
            }
        })
    };
};

module.exports = { createTagController };
