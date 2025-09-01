// src/services/cloudinaryService.js
const cloudinary = require('cloudinary').v2;

const createCloudinaryService = () => {
    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Generic upload function
    const uploadFile = async (fileBuffer, type = 'image', options = {}) => {
        return new Promise((resolve, reject) => {
            const defaultOptions = {
                resource_type: type,
                quality: 'auto',
                format: 'auto'
            };

            const uploadOptions = { ...defaultOptions, ...options };

            cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({
                            public_id: result.public_id,
                            secure_url: result.secure_url,
                            url: result.secure_url,
                            width: result.width,
                            height: result.height,
                            format: result.format,
                            bytes: result.bytes
                        });
                    }
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

    // Delete file from Cloudinary
    const deleteFile = async (publicId) => {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            console.error('Error deleting file from Cloudinary:', error);
            throw error;
        }
    };

    // Validate file type and size
    const validateFile = (file, type = 'image') => {
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxImageSize = 10 * 1024 * 1024; // 10MB

        if (type === 'image') {
            if (!validImageTypes.includes(file.mimetype)) {
                throw new Error('Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.');
            }
            if (file.size > maxImageSize) {
                throw new Error('Image size too large. Maximum 10MB allowed.');
            }
        }

        return true;
    };

    return {
        uploadFile,
        uploadAvatar,
        deleteFile,
        validateFile
    };
};

module.exports = { createCloudinaryService };
