// src/services/cloudinaryService.js
const cloudinary = require('../configs/cloudinary.config');
const { InternalServerError } = require('common/core/error.response');

const createCloudinaryService = () => {
    const uploadFile = (fileBuffer, resourceType = 'image') => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {resource_type: resourceType},
                (error, result ) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(new InternalServerError('Failed to upload file to Cloudinary.'));
                    }
                    resolve({
                        publicId: result.public_id,
                        url: result.secure_url
                    });
                }
            ).end(fileBuffer)
        });
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

    return {
        uploadFile,
        deleteFile
    };
}

module.exports = { createCloudinaryService };