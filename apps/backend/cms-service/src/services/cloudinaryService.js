// src/services/cloudinaryService.js
const cloudinary = require('../configs/cloudinary.config');
const { InternalServerError } = require('common/core/error.response');

const createCloudinaryService = () => {
    const uploadFile = (fileBuffer, resourceType = 'image', options = {}) => {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                resource_type: resourceType,
                ...options
            };

            cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(new InternalServerError('Failed to upload file to Cloudinary.'));
                    }
                    resolve({
                        publicId: result.public_id,
                        url: result.secure_url,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        bytes: result.bytes
                    });
                }
            ).end(fileBuffer);
        });
    };

    // Upload avatar with specific transformations
    const uploadAvatar = async (fileBuffer, userId) => {
        const options = {
            folder: 'avatars',
            public_id: `avatar_${userId}_${Date.now()}`,
            transformation: [
                { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                { quality: 'auto', format: 'auto' }
            ]
        };

        return await uploadFile(fileBuffer, 'image', options);
    };

    // Upload feedback images with optimization
    const uploadFeedbackImages = async (fileBuffers, feedbackId) => {
        if (!Array.isArray(fileBuffers)) {
            fileBuffers = [fileBuffers];
        }

        const uploadPromises = fileBuffers.map((buffer, index) => {
            const options = {
                folder: 'feedback',
                public_id: `feedback_${feedbackId}_${index}_${Date.now()}`,
                transformation: [
                    { width: 800, height: 600, crop: 'limit' },
                    { quality: 'auto', format: 'auto' }
                ]
            };
            return uploadFile(buffer, 'image', options);
        });

        return await Promise.all(uploadPromises);
    };

    // Upload post thumbnail
    const uploadThumbnail = async (fileBuffer, postId) => {
        const options = {
            folder: 'thumbnails',
            public_id: `thumbnail_${postId}_${Date.now()}`,
            transformation: [
                { width: 1200, height: 630, crop: 'fill' }, // Social media optimized
                { quality: 'auto', format: 'auto' }
            ]
        };

        return await uploadFile(fileBuffer, 'image', options);
    };

    // Upload general post media
    const uploadPostMedia = async (fileBuffer, postId, mediaType = 'image') => {
        const options = {
            folder: 'posts',
            public_id: `post_${postId}_${Date.now()}`,
            resource_type: mediaType
        };

        if (mediaType === 'image') {
            options.transformation = [
                { width: 1000, crop: 'limit' },
                { quality: 'auto', format: 'auto' }
            ];
        }

        return await uploadFile(fileBuffer, mediaType, options);
    };

    const deleteFile = async (publicId) => {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw new InternalServerError('Failed to delete file from Cloudinary.');
        }
    };

    // Delete multiple files
    const deleteFiles = async (publicIds) => {
        if (!Array.isArray(publicIds) || publicIds.length === 0) {
            return [];
        }

        try {
            const deletePromises = publicIds.map(publicId => 
                cloudinary.uploader.destroy(publicId)
            );
            const results = await Promise.all(deletePromises);
            return results;
        } catch (error) {
            console.error('Cloudinary bulk delete error:', error);
            throw new InternalServerError('Failed to delete files from Cloudinary.');
        }
    };

    // Generate thumbnail URL from existing image
    const generateThumbnails = (publicId, sizes = []) => {
        const defaultSizes = [
            { name: 'small', width: 150, height: 150 },
            { name: 'medium', width: 300, height: 300 },
            { name: 'large', width: 600, height: 600 }
        ];

        const thumbnailSizes = sizes.length > 0 ? sizes : defaultSizes;
        
        return thumbnailSizes.map(size => ({
            name: size.name,
            url: cloudinary.url(publicId, {
                width: size.width,
                height: size.height,
                crop: 'fill',
                quality: 'auto',
                format: 'auto'
            })
        }));
    };

    // Get optimized URL for different devices
    const getResponsiveUrl = (publicId, options = {}) => {
        return {
            mobile: cloudinary.url(publicId, {
                width: 480,
                crop: 'limit',
                quality: 'auto',
                format: 'auto',
                ...options
            }),
            tablet: cloudinary.url(publicId, {
                width: 768,
                crop: 'limit',
                quality: 'auto',
                format: 'auto',
                ...options
            }),
            desktop: cloudinary.url(publicId, {
                width: 1200,
                crop: 'limit',
                quality: 'auto',
                format: 'auto',
                ...options
            })
        };
    };

    // Validate file before upload
    const validateFile = (file, type = 'image') => {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov'];
        const maxImageSize = 10 * 1024 * 1024; // 10MB
        const maxVideoSize = 100 * 1024 * 1024; // 100MB

        if (type === 'image') {
            if (!validImageTypes.includes(file.mimetype)) {
                throw new Error('Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.');
            }
            if (file.size > maxImageSize) {
                throw new Error('Image size too large. Maximum 10MB allowed.');
            }
        } else if (type === 'video') {
            if (!validVideoTypes.includes(file.mimetype)) {
                throw new Error('Invalid video format. Only MP4, AVI, and MOV are allowed.');
            }
            if (file.size > maxVideoSize) {
                throw new Error('Video size too large. Maximum 100MB allowed.');
            }
        }

        return true;
    };

    return {
        uploadFile,
        uploadAvatar,
        uploadFeedbackImages,
        uploadThumbnail,
        uploadPostMedia,
        deleteFile,
        deleteFiles,
        generateThumbnails,
        getResponsiveUrl,
        validateFile
    };
}

module.exports = { createCloudinaryService };