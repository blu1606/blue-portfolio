// src/usecases/createFeedback.js
const { TooManyRequestsError } = require('common/core/error.response');

const createCreateFeedbackUseCase = (feedbackRepository, cloudinaryService, userRepository, mediaRepository) => {
    return async (feedbackData, files = {}, ipAddress, userAgent) => {
        const { userId, authorName, authorEmail, content, rating, isAnonymous } = feedbackData;
        
        // Note: Input validation is now handled by middleware layers
        // This usecase focuses on business logic only

        // Rate limiting for anonymous feedback
        if (isAnonymous && ipAddress) {
            // Check for duplicate feedback in last 30 minutes
            const isDuplicate = await feedbackRepository.checkDuplicateByIP(ipAddress);
            if (isDuplicate) {
                throw new TooManyRequestsError('Please wait 30 minutes before submitting another feedback.');
            }

            // Check daily limit (max 5 feedback per IP per day)
            const dailyCount = await feedbackRepository.getFeedbackCountByIP(ipAddress, 24);
            if (dailyCount >= 5) {
                throw new TooManyRequestsError('Daily feedback limit reached. Please try again tomorrow.');
            }
        }

        // Handle avatar logic
        let avatarUrl = null;
        let imageUrls = [];

        try {
            if (isAnonymous) {
                // Anonymous user: upload avatar if provided
                if (files.avatar && files.avatar[0]) {
                    const avatarResult = await cloudinaryService.uploadImage(
                        files.avatar[0].buffer,
                        `feedback/avatars/anonymous/${Date.now()}`
                    );
                    avatarUrl = avatarResult.secure_url;

                    // Save to media table for tracking
                    await mediaRepository.create({
                        filename: `anonymous_avatar_${Date.now()}.jpg`,
                        original_name: files.avatar[0].originalname,
                        mime_type: files.avatar[0].mimetype,
                        size_bytes: files.avatar[0].size,
                        url: avatarResult.secure_url,
                        cloudinary_public_id: avatarResult.public_id,
                        entity_type: 'feedback_avatar',
                        entity_id: null, // Will be updated after feedback creation
                        uploaded_by: null, // Anonymous user
                        alt_text: `Avatar for ${authorName}`,
                        title: `${authorName}'s Avatar`
                    });
                }
            } else {
                // Authenticated user: get avatar from user's media
                if (userId) {
                    const userAvatar = await mediaRepository.getUserAvatar(userId);
                    if (userAvatar) {
                        avatarUrl = userAvatar.url;
                    }
                    
                    // If user uploads new avatar in this feedback, update their avatar
                    if (files.avatar && files.avatar[0]) {
                        const avatarResult = await cloudinaryService.uploadImage(
                            files.avatar[0].buffer,
                            `users/avatars/${userId}/${Date.now()}`
                        );
                        
                        // Create/update user avatar in media table
                        const avatarMediaData = {
                            filename: `user_avatar_${userId}_${Date.now()}.jpg`,
                            original_name: files.avatar[0].originalname,
                            mime_type: files.avatar[0].mimetype,
                            size_bytes: files.avatar[0].size,
                            url: avatarResult.secure_url,
                            cloudinary_public_id: avatarResult.public_id,
                            entity_type: 'user_avatar',
                            entity_id: userId,
                            uploaded_by: userId,
                            alt_text: 'User Avatar',
                            title: 'Profile Avatar'
                        };

                        // Check if user already has avatar, update or create
                        if (userAvatar) {
                            await mediaRepository.update(userAvatar.id, avatarMediaData);
                        } else {
                            await mediaRepository.create(avatarMediaData);
                        }
                        
                        avatarUrl = avatarResult.secure_url;
                    }
                }
            }

            // Upload additional feedback images
            if (files.images && files.images.length > 0) {
                const uploadPromises = files.images.map(async (file, index) => {
                    const prefix = isAnonymous ? 'feedback/anonymous' : `feedback/users/${userId}`;
                    const result = await cloudinaryService.uploadImage(
                        file.buffer,
                        `${prefix}/${Date.now()}_${index}`
                    );

                    // Save to media table
                    await mediaRepository.create({
                        filename: `feedback_image_${Date.now()}_${index}.jpg`,
                        original_name: file.originalname,
                        mime_type: file.mimetype,
                        size_bytes: file.size,
                        url: result.secure_url,
                        cloudinary_public_id: result.public_id,
                        entity_type: 'feedback_image',
                        entity_id: null, // Will be updated after feedback creation
                        uploaded_by: isAnonymous ? null : userId,
                        alt_text: `Feedback image ${index + 1}`,
                        title: `Feedback attachment ${index + 1}`
                    });

                    return result.secure_url;
                });
                imageUrls = await Promise.all(uploadPromises);
            }
        } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            throw new BadRequestError('Failed to upload images. Please try again.');
        }

        // Sanitize content
        const sanitizedContent = content
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/<object[^>]*>.*?<\/object>/gi, '');

        // Prepare feedback data
        const newFeedbackData = {
            user_id: isAnonymous ? null : userId,
            author_name: isAnonymous ? authorName.trim() : null,
            author_email: isAnonymous ? authorEmail?.trim() || null : null,
            author_avatar_url: avatarUrl,
            content: sanitizedContent,
            rating: rating || null,
            images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
            is_approved: false, // Requires admin approval
            is_anonymous: Boolean(isAnonymous),
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: new Date().toISOString()
        };
        
        const newFeedback = await feedbackRepository.create(newFeedbackData);
        
        // Update media entities with feedback ID
        if (avatarUrl && isAnonymous) {
            await mediaRepository.updateEntityId('feedback_avatar', newFeedback.id, avatarUrl);
        }
        if (imageUrls.length > 0) {
            for (const imageUrl of imageUrls) {
                await mediaRepository.updateEntityId('feedback_image', newFeedback.id, imageUrl);
            }
        }
        
        return {
            id: newFeedback.id,
            message: 'Feedback submitted successfully! It will be reviewed by an administrator.',
            feedback: {
                id: newFeedback.id,
                content: newFeedback.content,
                rating: newFeedback.rating,
                authorName: newFeedback.author_name,
                avatarUrl: newFeedback.author_avatar_url,
                images: newFeedback.images ? JSON.parse(newFeedback.images) : [],
                isAnonymous: newFeedback.is_anonymous,
                createdAt: newFeedback.created_at
            }
        };
    };
};

module.exports = { createCreateFeedbackUseCase };