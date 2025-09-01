// src/repositories/postTagRepository.js
const { BadRequestError } = require('common/core/error.response');
const { RepositoryHelper } = require('common/utils/repositoryHelper');

const createPostTagRepository = (supabase) => {
    const repository = {
        // Link post to tags
        linkPostToTags: async (postId, tagIds) => {
            if (!tagIds || tagIds.length === 0) return [];

            try {
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
                    throw RepositoryHelper.handleDatabaseError(error, 'Error linking post to tags');
                }

                RepositoryHelper.logInfo('Post linked to tags successfully', { 
                    postId, 
                    tagCount: tagIds.length 
                });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error linking post to tags');
            }
        },

        // Unlink post from specific tags
        unlinkPostFromTags: async (postId, tagIds) => {
            if (!tagIds || tagIds.length === 0) return;

            try {
                const { error } = await supabase
                    .from('post_tags')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('post_id', postId)
                    .in('tag_id', tagIds);
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error unlinking post from tags');
                }

                RepositoryHelper.logInfo('Post unlinked from tags successfully', { 
                    postId, 
                    tagCount: tagIds.length 
                });
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error unlinking post from tags');
            }
        },

        // Unlink post from all tags
        unlinkAllPostTags: async (postId) => {
            try {
                const { error } = await supabase
                    .from('post_tags')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('post_id', postId);
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error unlinking all post tags');
                }

                RepositoryHelper.logInfo('All post tags unlinked successfully', { postId });
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error unlinking all post tags');
            }
        },

                // Get tags for a post
        getTagsByPostId: async (postId) => {
            try {
                const { data, error } = await supabase
                    .from('post_tags')
                    .select(`
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
                    throw RepositoryHelper.handleDatabaseError(error, 'Error getting tags by post ID');
                }

                RepositoryHelper.logInfo('Tags retrieved for post successfully', { 
                    postId, 
                    tagCount: data.length 
                });
                
                // Return only tag data
                return data.map(item => item.tags);
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error getting tags by post ID');
            }
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
                throw RepositoryHelper.handleDatabaseError(error, 'Error getting posts by tag ID');
            }

            RepositoryHelper.logInfo('Posts retrieved for tag successfully', { 
                tagId, 
                postCount: data.length,
                filters 
            });
            
            // Return only post data
            return data.map(item => item.posts);
        },

        // Replace all tags for a post (useful for updates)
        replacePostTags: async (postId, newTagIds) => {
            // First, soft delete all existing links
            await repository.unlinkAllPostTags(postId);
            
            // Then create new links
            if (newTagIds && newTagIds.length > 0) {
                return await repository.linkPostToTags(postId, newTagIds);
            }
            return [];
        },

        // Get post-tag relationship stats
        getStats: async (postId) => {
            try {
                const { data, error } = await supabase
                    .from('post_tags')
                    .select('tag_id')
                    .eq('post_id', postId)
                    .is('deleted_at', null);
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error getting post-tag stats');
                }

                RepositoryHelper.logInfo('Post-tag stats retrieved successfully', { 
                    postId, 
                    tagCount: data.length 
                });
                
                return { count: data.length };
            } catch (error) {
                RepositoryHelper.logError('Error getting post-tag stats', error, { postId });
                return { count: 0 };
            }
        },

        // Soft delete specific post-tag relationship
        softDelete: async (postId, tagId) => {
            try {
                const { data, error } = await supabase
                    .from('post_tags')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('post_id', postId)
                    .eq('tag_id', tagId)
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error soft deleting post-tag relationship');
                }

                RepositoryHelper.logInfo('Post-tag relationship soft deleted successfully', { postId, tagId });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error soft deleting post-tag relationship');
            }
        },

        // Restore soft deleted post-tag relationship
        restore: async (postId, tagId) => {
            try {
                const { data, error } = await supabase
                    .from('post_tags')
                    .update({ deleted_at: null })
                    .eq('post_id', postId)
                    .eq('tag_id', tagId)
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error restoring post-tag relationship');
                }

                RepositoryHelper.logInfo('Post-tag relationship restored successfully', { postId, tagId });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error restoring post-tag relationship');
            }
        }
    };

    return repository;
};

module.exports = { createPostTagRepository };
