import { supabase } from './supabase.js';

/**
 * Add a new comment to a post
 * @param {string} postId - The ID of the post/content
 * @param {string} userId - The Firebase UID of the user
 * @param {string} name - The display name of the user
 * @param {string} text - The comment content
 */
export async function addComment(postId, userId, name, text) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    post_id: postId,
                    user_id: userId,
                    user_name: name,
                    content: text
                }
            ])
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding comment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all comments for a specific post
 * @param {string} postId - The ID of the post/content
 */
export async function getComments(postId) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting comments:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a comment
 * @param {string} commentId - The ID of the comment in Supabase
 * @param {string} userId - The Firebase UID (for authorization check)
 */
export async function deleteComment(commentId, userId) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', userId); // Ensure only owner can delete

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error: error.message };
    }
}
