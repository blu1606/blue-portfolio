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

    const findBySlug = async (slug, includeDeleted = false) => {
        let query = supabase
            .from('posts')
            .select('*')
            .eq('slug', slug);

        if (!includeDeleted) {
            query = query.is('deleted_at', null);
        }

        const { data, error } = await query.single();

        if (error && error.code === 'PGRST116') {
            return null; // Post not found
        }
        if (error) {
            console.error('Database error finding post:', error);
            throw new BadRequestError('Failed to find post.');
        }
        return data;
    }

    const findById = async (postId, includeDeleted = false) => {
        let query = supabase
            .from('posts')
            .select('*')
            .eq('id', postId);

        if (!includeDeleted) {
            query = query.is('deleted_at', null);
        }

        const { data, error } = await query.single();
        
        if (error && error.code === 'PGRST116') {
            return null; // Post not found
        }
        if (error) {
            console.error('Database error finding post:', error);
            throw new BadRequestError('Failed to find post.');
        }
        return data;
    }
    
    const getAll = async (filters = {}) => {
        let query = supabase
            .from('posts')
            .select('*')
            .is('deleted_at', null);

        // Apply filters
        if (filters.published !== undefined) {
            query = query.eq('is_published', filters.published);
        }

        if (filters.authorId) {
            query = query.eq('author_id', filters.authorId);
        }

        // Apply sorting
        if (filters.sortBy === 'views') {
            query = query.order('views_count', { ascending: false });
        } else if (filters.sortBy === 'title') {
            query = query.order('title', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        if (filters.limit) {
            query = query.limit(filters.limit);
        }
        if (filters.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Database error getting all posts:', error);
            throw new BadRequestError('Failed to retrieve posts.');
        }
        return data;
    }
    
    const update = async (postId, updateData) => {
        const { data, error } = await supabase
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

    const searchByRegExp = async ({ patterns, fields, options }) => {
        let query = supabase.from('posts').select('*');

        // Build a dynamic search condition
        const conditions = fields.map(field => {
            const patternStrings = patterns.map(p => `ilike.%${p}%`);
            return `(${field}.or(${patternStrings.join(',')}))`;
        });
        
        query = query.or(conditions.join(','));

        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.offset) {
            query = query.offset(options.offset);
        }
        
        const { data, error } = await query;

        if (error) {
            console.error('Database error during search:', error);
            throw new BadRequestError('Failed to perform search.');
        }
        return data;
    };

    const countByRegExp = async ({ patterns, fields }) => {
        let query = supabase.from('posts').select('count', { count: 'exact' });

        const conditions = fields.map(field => {
            const patternStrings = patterns.map(p => `ilike.%${p}%`);
            return `(${field}.or(${patternStrings.join(',')}))`;
        });
        
        query = query.or(conditions.join(','));
        
        const { count, error } = await query;
        
        if (error) {
            console.error('Database count error:', error);
            throw new BadRequestError('Failed to count search results.');
        }
        return count;
    };

    const getPaginatedPosts = async (limit, offset) => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, created_at, is_published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Database error fetching paginated posts:', error);
        throw new BadRequestError('Failed to retrieve posts.');
      }
      return data;
    };

    const countAllPosts = async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (error) {
        console.error('Database error counting posts:', error);
        throw new BadRequestError('Failed to count posts.');
      }
      return count;
    };

    // New methods for enhanced functionality
    const updateViewsCount = async (postId) => {
        const { data, error } = await supabase
            .rpc('increment_post_views', { post_id: postId });
        
        if (error) {
            console.error('Database error updating views count:', error);
            // Don't throw error, views increment is not critical
            console.warn('Failed to increment views count');
        }
        return data;
    };

    const updateThumbnail = async (postId, thumbnailUrl) => {
        const { data, error } = await supabase
            .from('posts')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', postId)
            .is('deleted_at', null)
            .select()
            .single();
        
        if (error) {
            console.error('Database error updating thumbnail:', error);
            throw new BadRequestError('Failed to update post thumbnail.');
        }
        return data;
    };

    const updateCommentsCount = async (postId, increment = 1) => {
        const { data, error } = await supabase
            .rpc('increment_post_comments_count', { 
                post_id: postId, 
                increment_by: increment 
            });
        
        if (error) {
            console.error('Database error updating comments count:', error);
            // Don't throw error, comment count is not critical
            console.warn('Failed to update comments count');
        }
        return data;
    };

    const softDelete = async (postId) => {
        const { data, error } = await supabase
            .from('posts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', postId)
            .select()
            .single();
        
        if (error) {
            console.error('Database error soft deleting post:', error);
            throw new BadRequestError('Failed to delete post.');
        }
        return data;
    };

    const restore = async (postId) => {
        const { data, error } = await supabase
            .from('posts')
            .update({ deleted_at: null })
            .eq('id', postId)
            .select()
            .single();
        
        if (error) {
            console.error('Database error restoring post:', error);
            throw new BadRequestError('Failed to restore post.');
        }
        return data;
    };

    const getPopular = async (limit = 10, timeframe = '30 days') => {
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, slug, views_count, created_at, thumbnail_url')
            .is('deleted_at', null)
            .eq('is_published', true)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('views_count', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Database error getting popular posts:', error);
            throw new BadRequestError('Failed to retrieve popular posts.');
        }
        return data;
    };

    const getRelated = async (postId, limit = 5) => {
        // Get posts with similar tags (simplified version)
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, slug, excerpt, thumbnail_url, created_at')
            .is('deleted_at', null)
            .eq('is_published', true)
            .neq('id', postId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Database error getting related posts:', error);
            throw new BadRequestError('Failed to retrieve related posts.');
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
        countByRegExp,
        getPaginatedPosts,
        countAllPosts,
        // New enhanced methods
        updateViewsCount,
        updateThumbnail,
        updateCommentsCount,
        softDelete,
        restore,
        getPopular,
        getRelated
    };
}


module.exports = {
    createPostRepository
}
