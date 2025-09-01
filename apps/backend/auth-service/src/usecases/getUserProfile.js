// src/usecases/getUserProfile.js
const { NotFoundError } = require('common/core/error.response');

const createGetUserProfileUseCase = (userRepository, mediaRepository) => {
  return async (userId) => {
    // Find user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Try to get user's avatar from media table, but don't fail if it errors
    let avatar = null;
    try {
      avatar = await mediaRepository.getUserAvatar(userId);
    } catch (error) {
      console.warn('Failed to get user avatar, continuing without it:', error.message);
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        email_verified: user.email_verified || false,
        profile_picture_url: avatar ? avatar.url : (user.profile_picture_url || null),
        bio: user.bio || null,
        location: user.location || null,
        website: user.website || null,
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
        last_login_at: user.last_login_at || null
      }
    };
  };
};

module.exports = { createGetUserProfileUseCase };
