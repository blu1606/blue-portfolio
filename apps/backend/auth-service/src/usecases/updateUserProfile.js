// src/usecases/updateUserProfile.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');
const { validateString, validateOptional } = require('../utils/validation');

const createUpdateUserProfileUseCase = (userRepository, mediaRepository, cloudinaryService) => {
  return async (userId, profileData, avatarFile = null, auditDetails = {}) => {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate profile data
    const validatedData = {};
    
    if (profileData.username !== undefined) {
      validatedData.username = validateString(profileData.username, 'Username', 3, 50);
    }
    
    if (profileData.bio !== undefined) {
      validatedData.bio = validateOptional(profileData.bio, 'Bio', 0, 500);
    }
    
    if (profileData.location !== undefined) {
      validatedData.location = validateOptional(profileData.location, 'Location', 0, 100);
    }
    
    if (profileData.website !== undefined) {
      if (profileData.website && profileData.website.trim()) {
        const websiteRegex = /^https?:\/\/.+\..+/;
        if (!websiteRegex.test(profileData.website)) {
          throw new BadRequestError('Website must be a valid URL starting with http:// or https://');
        }
      }
      validatedData.website = profileData.website ? profileData.website.trim() : null;
    }

    // Handle avatar upload
    let avatarUrl = user.profile_picture_url;
    
    if (avatarFile) {
      try {
        // Validate avatar file
        cloudinaryService.validateFile(avatarFile, 'image');
        
        // Get current avatar to delete later
        const currentAvatar = await mediaRepository.getUserAvatar(userId);
        
        // Upload new avatar
        const uploadResult = await cloudinaryService.uploadAvatar(avatarFile.buffer, userId);
        avatarUrl = uploadResult.secure_url;
        
        // Create media record for new avatar
        const avatarMediaData = {
          filename: `user_avatar_${userId}_${Date.now()}.jpg`,
          original_name: avatarFile.originalname,
          mime_type: avatarFile.mimetype,
          size_bytes: avatarFile.size,
          url: uploadResult.secure_url,
          cloudinary_public_id: uploadResult.public_id,
          entity_type: 'user_avatar',
          entity_id: userId,
          uploaded_by: userId,
          alt_text: 'User Avatar',
          title: 'Profile Avatar'
        };

        // Update or create avatar record
        if (currentAvatar) {
          await mediaRepository.update(currentAvatar.id, avatarMediaData);
          // Delete old avatar from Cloudinary
          if (currentAvatar.cloudinary_public_id) {
            try {
              await cloudinaryService.deleteFile(currentAvatar.cloudinary_public_id);
            } catch (error) {
              console.warn('Failed to delete old avatar from Cloudinary:', error.message);
            }
          }
        } else {
          await mediaRepository.create(avatarMediaData);
        }
        
        // Update profile_picture_url in user record
        validatedData.profile_picture_url = avatarUrl;
        
      } catch (error) {
        console.error('Avatar upload error:', error);
        throw new BadRequestError(`Avatar upload failed: ${error.message}`);
      }
    }

    // Update user profile
    const updatedUser = await userRepository.updateProfile(userId, validatedData);

    return {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        email_verified: updatedUser.email_verified,
        profile_picture_url: updatedUser.profile_picture_url,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        last_login_at: updatedUser.last_login_at
      }
    };
  };
};

module.exports = { createUpdateUserProfileUseCase };
