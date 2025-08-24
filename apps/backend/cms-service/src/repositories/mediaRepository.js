// src/repositories/mediaRepository.js
const { BadRequestError } = require('common/core/error.response');

const createMediaRepository = (supabase) => {
    const create = async (mediaData) => {
        const { data, error } = await supabase
            .from('media')
            .insert([mediaData])
            .select()
            .single();
        if (error) {
            console.error('Database error creating media:', error);
            throw new BadRequestError('Failed to create media entry.');
        }
        return data;
    }

    const findByPostId = async (postId) => {
        const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('post_id', postId);

        if (error) {
            console.error('Database error finding media:', error);
            throw new BadRequestError('Failed to retrieve media for post.');
        }
        return data;
    };
    
    const removeByPublicId = async (publicId) => {
        const { error } = await supabase
            .from('media')
            .delete()
            .eq('public_id', publicId);
            
        if (error) {
            console.error('Database error deleting media:', error);
            throw new BadRequestError('Failed to delete media entry.');
        }
        return { success: true };
    };

    return {
        create,
        findByPostId,
        removeByPublicId
    };
};

module.exports = { createMediaRepository };