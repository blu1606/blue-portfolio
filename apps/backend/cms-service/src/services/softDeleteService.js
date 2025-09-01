// src/services/softDeleteService.js
const { BadRequestError } = require('common/core/error.response');
const { createLogger } = require('common/utils/logger');
const Logger = createLogger('SoftDeleteService');

const createSoftDeleteService = (container) => {
    const service = {
        // Get repository instance for entity type
        getRepository: (entityType) => {
            const repositoryMap = {
                'post': 'postRepository',
                'comment': 'commentRepository',
                'feedback': 'feedbackRepository',
                'media': 'mediaRepository',
                'tag': 'tagRepository'
            };

            const repositoryName = repositoryMap[entityType.toLowerCase()];
            if (!repositoryName) {
                return null;
            }

            try {
                return container.get(repositoryName);
            } catch (error) {
                Logger.error(`Repository ${repositoryName} not found`, { 
                    error: error.message, 
                    entityType, 
                    repositoryName 
                });
                return null;
            }
        },

        // Check if entity type is user-owned (requires ownership validation)
        isUserOwnedEntity: (entityType) => {
            const userOwnedEntities = ['post', 'comment', 'feedback', 'media'];
            return userOwnedEntities.includes(entityType.toLowerCase());
        },

        // Unified soft delete for any entity
        softDelete: async (entityType, entityId, userId = null) => {
            const repository = service.getRepository(entityType);
            
            if (!repository || !repository.softDelete) {
                throw new BadRequestError(`Soft delete not supported for ${entityType}.`);
            }

            // Authorization check for user-owned entities
            if (userId && repository.findById) {
                const entity = await repository.findById(entityId);
                if (!entity) {
                    throw new BadRequestError(`${entityType} not found.`);
                }

                // Check ownership for user-owned entities
                if (service.isUserOwnedEntity(entityType) && entity.user_id !== userId && entity.author_id !== userId) {
                    throw new BadRequestError('You can only delete your own content.');
                }
            }

            return await repository.softDelete(entityId);
        },

        // Unified restore for any entity
        restore: async (entityType, entityId, userId = null) => {
            const repository = service.getRepository(entityType);
            
            if (!repository || !repository.restore) {
                throw new BadRequestError(`Restore not supported for ${entityType}.`);
            }

            // Authorization check for user-owned entities
            if (userId && repository.findById) {
                const entity = await repository.findById(entityId, true); // Include deleted
                if (!entity) {
                    throw new BadRequestError(`${entityType} not found.`);
                }

                // Check ownership for user-owned entities
                if (service.isUserOwnedEntity(entityType) && entity.user_id !== userId && entity.author_id !== userId) {
                    throw new BadRequestError('You can only restore your own content.');
                }
            }

            return await repository.restore(entityId);
        },

        // Clean up old soft-deleted records
        cleanupDeleted: async (entityType, daysOld = 30) => {
            const repository = service.getRepository(entityType);
            
            if (!repository || !repository.findAll) {
                throw new BadRequestError(`Cleanup not supported for ${entityType}.`);
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            // This would need a specific method in each repository
            // For now, just return a placeholder
            console.log(`Cleanup for ${entityType} older than ${daysOld} days would be implemented here`);
            
            return {
                entityType,
                cutoffDate: cutoffDate.toISOString(),
                message: 'Cleanup logic to be implemented in repositories'
            };
        },

        // Bulk soft delete multiple entities
        bulkSoftDelete: async (entityType, entityIds, userId = null) => {
            if (!Array.isArray(entityIds) || entityIds.length === 0) {
                return [];
            }

            const results = [];
            for (const entityId of entityIds) {
                try {
                    const result = await service.softDelete(entityType, entityId, userId);
                    results.push({ entityId, success: true, data: result });
                } catch (error) {
                    results.push({ 
                        entityId, 
                        success: false, 
                        error: error.message 
                    });
                }
            }

            return results;
        },

        // Bulk restore multiple entities
        bulkRestore: async (entityType, entityIds, userId = null) => {
            if (!Array.isArray(entityIds) || entityIds.length === 0) {
                return [];
            }

            const results = [];
            for (const entityId of entityIds) {
                try {
                    const result = await service.restore(entityType, entityId, userId);
                    results.push({ entityId, success: true, data: result });
                } catch (error) {
                    results.push({ 
                        entityId, 
                        success: false, 
                        error: error.message 
                    });
                }
            }

            return results;
        },

        // Get soft delete statistics
        getSoftDeleteStats: async () => {
            const stats = {};
            const entityTypes = ['post', 'comment', 'feedback', 'media', 'tag'];

            for (const entityType of entityTypes) {
                const repository = service.getRepository(entityType);
                if (repository && repository.findAll) {
                    try {
                        // Get active count
                        const activeItems = await repository.findAll({ includeDeleted: false });
                        // This would need a specific method to get deleted items
                        // For now, just placeholder
                        stats[entityType] = {
                            active: activeItems.length,
                            deleted: 0, // Would need specific implementation
                            total: activeItems.length
                        };
                    } catch (error) {
                        console.error(`Error getting stats for ${entityType}:`, error);
                        stats[entityType] = { active: 0, deleted: 0, total: 0 };
                    }
                }
            }

            return stats;
        },

        // Permanently delete old soft-deleted records
        permanentlyDelete: async (entityType, entityId, userId = null) => {
            const repository = service.getRepository(entityType);
            
            if (!repository || !repository.remove) {
                throw new BadRequestError(`Permanent delete not supported for ${entityType}.`);
            }

            // Only allow permanent deletion of already soft-deleted items
            if (repository.findById) {
                const entity = await repository.findById(entityId, true); // Include deleted
                if (!entity) {
                    throw new BadRequestError(`${entityType} not found.`);
                }

                if (!entity.deleted_at) {
                    throw new BadRequestError('Item must be soft-deleted first before permanent deletion.');
                }

                // Check ownership for user-owned entities
                if (userId && service.isUserOwnedEntity(entityType) && 
                    entity.user_id !== userId && entity.author_id !== userId) {
                    throw new BadRequestError('You can only permanently delete your own content.');
                }
            }

            return await repository.remove(entityId);
        }
    };

    return service;
};

module.exports = { createSoftDeleteService };
