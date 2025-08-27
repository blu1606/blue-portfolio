// src/repositories/postTagRepository.js
const { BadRequestError } = require('common/core/error.response');

const createPostTagRepository = (supabase) => {
    return {
        // Link post to tags
        linkPostToTags: async (postId, tagIds) => {
            if (!tagIds || tagIds.length === 0) return [];

            const postTags = tagIds.map(tagId => ({
                post_id: postId,
                tag_id: tagId,
                created_at: new Date().toISOString()
            }));

            const { data, error } = await supabase
                .from('post_tags')
                .insert(postTags)
                .select();
            
            if (error) {
                console.error('Database error linking post to tags:', error);
                throw new BadRequestError('Failed to link post to tags.');
            }
            return data;
        },

        // Unlink post from specific tags
        unlinkPostFromTags: async (postId, tagIds) => {
            if (!tagIds || tagIds.length === 0) return;

            const { error } = await supabase
                .from('post_tags')
                .update({ deleted_at: new Date().toISOString() })
                .eq('post_id', postId)
                .in('tag_id', tagIds);
            
            if (error) {
                console.error('Database error unlinking post from tags:', error);
                throw new BadRequestError('Failed to unlink post from tags.');
            }
        },

        // Unlink post from all tags
        unlinkAllPostTags: async (postId) => {
            const { error } = await supabase
                .from('post_tags')
                .update({ deleted_at: new Date().toISOString() })
                .eq('post_id', postId);
            
            if (error) {
                console.error('Database error unlinking all post tags:', error);
                throw new BadRequestError('Failed to unlink post from all tags.');
            }
        },

        // Get tags for a specific post
        getTagsByPostId: async (postId) => {
            const { data, error } = await supabase
                .from('post_tags')
                .select(`
                    tag_id,
                    tags!inner (
                        id,
                        name,
                        slug,
                        description
                    )
                `)
                .eq('post_id', postId)
                .is('deleted_at', null)
                .is('tags.deleted_at', null);
            
            if (error) {
                console.error('Database error getting tags by post ID:', error);
                throw new BadRequestError('Failed to retrieve post tags.');
            }
            
            // Return only tag data
            return data.map(item => item.tags);
        },

        // Get posts for a specific tag
        getPostsByTagId: async (tagId, filters = {}) => {
            let query = supabase
                .from('post_tags')
                .select(`
                    post_id,
                    posts!inner (
                        id,
                        title,
                        slug,
                        excerpt,
                        thumbnail_url,
                        is_published,
                        created_at,
                        author_id,
                        views_count
                    )
                `)
                .eq('tag_id', tagId)
                .is('deleted_at', null)
                .is('posts.deleted_at', null);

            // Only show published posts for public access
            if (!filters.includeUnpublished) {
                query = query.eq('posts.is_published', true);
            }

            // Apply sorting
            if (filters.sortBy === 'views') {
                query = query.order('views_count', { ascending: false, foreignTable: 'posts' });
            } else {
                query = query.order('created_at', { ascending: false, foreignTable: 'posts' });
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
                console.error('Database error getting posts by tag ID:', error);
                throw new BadRequestError('Failed to retrieve posts for tag.');
            }
            
            // Return only post data
            return data.map(item => item.posts);
        },

        // Replace all tags for a post (useful for updates)
        replacePostTags: async (postId, newTagIds) => {
            // First, soft delete all existing links
            await this.unlinkAllPostTags(postId);
            
            // Then create new links
            if (newTagIds && newTagIds.length > 0) {
                return await this.linkPostToTags(postId, newTagIds);
            }
            return [];
        },

        // Get post-tag relationship stats
        getStats: async (postId) => {
            const { data, error } = await supabase
                .from('post_tags')
                .select('tag_id')
                .eq('post_id', postId)
                .is('deleted_at', null);
            
            if (error) {
                console.error('Database error getting post-tag stats:', error);
                return { count: 0 };
            }
            
            return { count: data.length };
        },

        // Soft delete specific post-tag relationship
        softDelete: async (postId, tagId) => {
            const { data, error } = await supabase
                .from('post_tags')
                .update({ deleted_at: new Date().toISOString() })
                .eq('post_id', postId)
                .eq('tag_id', tagId)
                .select()
                .single();
            
            if (error) {
                console.error('Database error soft deleting post-tag:', error);
                throw new BadRequestError('Failed to remove tag from post.');
            }
            return data;
        },

        // Restore soft deleted post-tag relationship
        restore: async (postId, tagId) => {
            const { data, error } = await supabase
                .from('post_tags')
                .update({ deleted_at: null })
                .eq('post_id', postId)
                .eq('tag_id', tagId)
                .select()
                .single();
            
            if (error) {
                console.error('Database error restoring post-tag:', error);
                throw new BadRequestError('Failed to restore tag to post.');
            }
            return data;
        }
    };
};

module.exports = { createPostTagRepository };
