// src/services/mediaService.js
/**
 * Media Service using BaseService pattern
 */

const BaseService = require('../core/BaseService');
const { BadRequestError } = require('common/core/error.response');
const { configManager } = require('common/configs/configManager');

class MediaService extends BaseService {
  constructor(mediaRepository, cacheService, cloudinaryService) {
    super('MediaService', mediaRepository, cacheService);
    this.cloudinaryService = cloudinaryService;
  }

  // Override base methods with specific logic
  async create(mediaData, options = {}) {
    // Validate file size using config
    const maxFileSize = configManager.get('upload.maxFileSize');
    if (mediaData.size && mediaData.size > maxFileSize) {
      throw new BadRequestError(`File size exceeds limit of ${maxFileSize} bytes`);
    }

    // Validate file type using config
    const allowedTypes = configManager.get('upload.allowedTypes');
    if (mediaData.type && !allowedTypes.includes(mediaData.type)) {
      throw new BadRequestError(`File type ${mediaData.type} not allowed`);
    }

    // Upload to Cloudinary first
    if (mediaData.fileBuffer) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(
          mediaData.fileBuffer,
          'image',
          { folder: 'cms-uploads' }
        );
        
        mediaData.url = uploadResult.url;
        mediaData.public_id = uploadResult.publicId;
        mediaData.width = uploadResult.width;
        mediaData.height = uploadResult.height;
        
        // Remove buffer before saving to DB
        delete mediaData.fileBuffer;
      } catch (error) {
        this.logger.error('Failed to upload media to Cloudinary', { error: error.message });
        throw new BadRequestError('Failed to upload media file');
      }
    }

    // Use base create method with cache invalidation
    return super.create(mediaData, options);
  }

  async delete(id, options = {}) {
    // Get media info before deletion for cleanup
    const media = await this.findById(id, { skipCache: true });
    if (!media) {
      throw new BadRequestError('Media not found');
    }

    // Delete from Cloudinary
    if (media.public_id) {
      try {
        await this.cloudinaryService.deleteFile(media.public_id);
        this.logger.info('Media deleted from Cloudinary', { publicId: media.public_id });
      } catch (error) {
        this.logger.warn('Failed to delete from Cloudinary', { 
          publicId: media.public_id, 
          error: error.message 
        });
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Use base delete method
    return super.delete(id, options);
  }

  // Custom methods specific to media
  async getMediaByEntity(entityType, entityId, options = {}) {
    const cacheKey = this.cacheHelper?.generateKey('media:entity', { entityType, entityId });
    
    if (this.cacheHelper && !options.skipCache) {
      return this.cacheHelper.getWithFallback(
        cacheKey,
        () => this.repository.findByEntity(entityType, entityId),
        configManager.get('cache.patterns.list')
      );
    }

    return this.repository.findByEntity(entityType, entityId);
  }

  async getMediaStats(options = {}) {
    if (this.cacheHelper && !options.skipCache) {
      return this.cacheHelper.cacheCount('media:stats', 
        () => this.repository.getStats(),
        configManager.get('cache.patterns.count')
      );
    }

    return this.repository.getStats();
  }

  // Bulk operations
  async bulkDelete(ids) {
    const medias = await Promise.all(
      ids.map(id => this.findById(id, { skipCache: true }))
    );

    // Delete from Cloudinary first
    const cloudinaryIds = medias
      .filter(media => media && media.public_id)
      .map(media => media.public_id);

    if (cloudinaryIds.length > 0) {
      try {
        await this.cloudinaryService.bulkDelete(cloudinaryIds);
        this.logger.info('Bulk deleted from Cloudinary', { count: cloudinaryIds.length });
      } catch (error) {
        this.logger.warn('Bulk Cloudinary deletion failed', { error: error.message });
      }
    }

    // Delete from database
    const results = await Promise.all(
      ids.map(id => super.delete(id, { skipCache: true }))
    );

    // Invalidate cache
    if (this.cacheHelper) {
      await this.cacheHelper.invalidateAll(this.serviceName);
    }

    return {
      deleted: results.filter(result => result).length,
      total: ids.length
    };
  }
}

const createMediaService = (mediaRepository, cacheService, cloudinaryService) => {
  return new MediaService(mediaRepository, cacheService, cloudinaryService);
};

module.exports = { MediaService, createMediaService };
