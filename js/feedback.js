// feedback.js - Handle user feedback collection
import { supabase } from './supabase.js';
import { updateRewards } from './rewards.js';

// Initialize feedback functionality
export function initFeedback() {
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', handleFeedbackSubmission);
  }
}

// Handle feedback form submission
async function handleFeedbackSubmission(event) {
  event.preventDefault();

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    showNotification('Please log in to submit feedback.', 'error');
    return;
  }

  const feedbackType = document.getElementById('feedback-type').value;
  const subject = document.getElementById('feedback-subject').value.trim();
  const message = document.getElementById('feedback-message').value.trim();
  const rating = document.getElementById('feedback-rating').value;

  // Validation
  if (!subject || !message) {
    showNotification('Please fill in all required fields.', 'error');
    return;
  }

  if (message.length < 10) {
    showNotification('Please provide more detailed feedback (at least 10 characters).', 'error');
    return;
  }

  try {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Get user profile for additional context
    const { data: profileData } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, class_grade')
      .eq('id', user.id)
      .single();

    const pData = profileData || {};

    // Submit feedback to Supabase
    const { error } = await supabase
      .from('feedback')
      .insert([
        {
          user_id: user.id,
          user_email: user.email,
          user_name: pData.first_name && pData.last_name
            ? `${pData.first_name} ${pData.last_name}`
            : user.email.split('@')[0],
          feedback_type: feedbackType,
          subject: subject,
          message: message,
          rating: parseInt(rating),
          user_role: pData.role || 'Student',
          user_class: pData.class_grade || 'Not specified',
          status: 'pending'
        }
      ]);

    if (error) throw error;

    showNotification('Thank you for your feedback! We appreciate your input.', 'success');

    // Reset form
    document.getElementById('feedback-form').reset();

    // Update rewards (+1 point for feedback)
    await updateRewards(user.id, 1);

    // Refresh history
    loadUserFeedback();

    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;

  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification('Failed to submit feedback. Please try again.', 'error');
  }
}

// Load user's previous feedback from Supabase
export async function loadUserFeedback() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const feedbackHistory = document.getElementById('feedback-history');
    if (!feedbackHistory) return;

    feedbackHistory.innerHTML = '';

    if (!data || data.length === 0) {
      feedbackHistory.innerHTML = '<p class="text-center text-secondary py-4">No feedback submitted yet.</p>';
      return;
    }

    data.forEach((feedback) => {
      const feedbackItem = document.createElement('div');
      feedbackItem.className = 'bg-tertiary rounded-lg p-4 border border-primary/50 mb-4';

      const submittedDate = new Date(feedback.created_at).toLocaleDateString();
      const statusColor = feedback.status === 'addressed' ? 'text-green-400' :
        feedback.status === 'reviewed' ? 'text-blue-400' : 'text-yellow-400';

      feedbackItem.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-bold text-primary">${feedback.subject}</h4>
          <span class="text-xs ${statusColor} capitalize">${feedback.status}</span>
        </div>
        <p class="text-sm text-secondary mb-2">${feedback.message.substring(0, 100)}${feedback.message.length > 100 ? '...' : ''}</p>
        <div class="flex justify-between items-center text-xs text-secondary">
          <span>${feedback.feedback_type}</span>
          <span>${submittedDate}</span>
        </div>
        ${feedback.admin_response ? `
          <div class="mt-3 p-3 bg-primary/50 rounded border-l-4 border-accent">
            <p class="text-sm text-accent font-medium">Admin Response:</p>
            <p class="text-sm text-secondary">${feedback.admin_response}</p>
          </div>
        ` : ''}
      `;

      feedbackHistory.appendChild(feedbackItem);
    });

  } catch (error) {
    console.error('Error loading feedback history:', error);
  }
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
