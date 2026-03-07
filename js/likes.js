import { supabase } from './supabase.js';

/**
 * Toggle a like on a post
 * @param {string} postId - The ID of the post/content
 * @param {string} userId - The Firebase UID of the user
 */
export async function toggleLike(postId, userId) {
    try {
        // Check if already liked
        const { data: existingLike, error: fetchError } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingLike) {
            // Unlike
            const { error: deleteError } = await supabase
                .from('likes')
                .delete()
                .eq('id', existingLike.id);

            if (deleteError) throw deleteError;
            return { action: 'unliked' };
        } else {
            // Like
            const { error: insertError } = await supabase
                .from('likes')
                .insert([{ post_id: postId, user_id: userId }]);

            if (insertError) throw insertError;
            return { action: 'liked' };
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get the total like count for a post
 * @param {string} postId - The ID of the post/content
 */
export async function getLikeCount(postId) {
    try {
        const { count, error } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        if (error) throw error;
        return { success: true, count };
    } catch (error) {
        console.error('Error getting like count:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if a user has liked a post
 * @param {string} postId - The ID of the post/content
 * @param {string} userId - The Firebase UID of the user
 */
export async function hasLiked(postId, userId) {
    if (!userId) return false;
    try {
        const { data, error } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Error checking like status:', error);
        return false;
    }
}
