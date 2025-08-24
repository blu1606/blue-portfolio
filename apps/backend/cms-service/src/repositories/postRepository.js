// src/repositories/postRepository.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');

const createPostRepository = (supabase) => {
    const create =  async (postData) => {
        const { data, error } = await supabase
            .from('posts')
            .insert([postData])
            .select()
            .single();
        
        if (error) {
            console.log('Database error creating post: ', error);
            throw new BadRequestError('Failed to create post');
        }
        return data; 
    };

    const findBySlug = async (slug) => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error && error.code === 'PGRST116') {
            return null; // Post not found
        }
        if (error) {
            console.error('Database error finding post:', error);
            throw new BadRequestError('Failed to find post.');
        }
        return data;
    }

    const findById = async (postId) => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();
        
        if (error && error.code === 'PGRST116') {
            return null; // Post not found
        }
        if (error) {
            console.error('Database error finding post:', error);
            throw new BadRequestError('Failed to find post.');
        }
        return data;
    }
    
    const getAll = async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Database error getting all posts:', error);
            throw new BadRequestError('Failed to retrieve posts.');
        }
        return data;
    }
    
    const update = (postId, updateData) => {
        const {data, error} = supabase
            .from('posts')
            .update(updateData)
            .eq('id', postId)
            .select()
            .single();
        
        if (error) {
          console.error('Database error updating post:', error);
          throw new BadRequestError('Failed to update post.');
        }
        return data;
    }

    const remove = async (postId) => {
        const { data, error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .select();

        if (error) {
            console.error('Database error deleting post:', error);
            throw new BadRequestError('Failed to delete post.');
        }
        return { success: true };
    }

    const searchByRegExp = async (pattern) => {
        // Tìm kiếm trong cả title và content
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .or(`title.ilike.%${pattern}%,content.ilike.%${pattern}%`);

        if (error) {
            console.error('Database error during search:', error);
            throw new Error('Failed to perform search.');
        }
        return data;
    };


    return {
        create,
        findBySlug,
        findById,
        getAll,
        update,
        remove,
        searchByRegExp,
    };
}


module.exports = {
    createPostRepository
}
