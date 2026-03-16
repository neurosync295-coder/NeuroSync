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
      feedbackItem.className = 'bg-obsidian border border-raw p-4 mb-4 relative hover:border-white/20 transition-colors';

      const submittedDate = new Date(feedback.created_at).toLocaleDateString();
      const statusColor = feedback.status === 'addressed' ? 'text-green-500' :
        feedback.status === 'reviewed' ? 'text-blue-500' : 'text-accent-signal';

      feedbackItem.innerHTML = `
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#27272A] group-hover:bg-accent-signal transition-colors"></div>
        <div class="flex justify-between items-start mb-3 ml-2">
          <h4 class="font-bold text-primary text-sm font-mono truncate max-w-[200px]">${feedback.subject}</h4>
          <span class="text-[10px] font-mono border border-raw px-1 py-0.5 ${statusColor} uppercase tracking-wider">${feedback.status}</span>
        </div>
        <p class="text-xs font-mono text-secondary mb-3 ml-2">${feedback.message.substring(0, 100)}${feedback.message.length > 100 ? '...' : ''}</p>
        <div class="flex justify-between items-center text-[10px] text-muted font-mono ml-2 border-t border-raw pt-2">
          <span>TX: ${feedback.feedback_type}</span>
          <span>TS: ${submittedDate}</span>
        </div>
        ${feedback.admin_response ? `
          <div class="mt-3 ml-2 p-2 bg-graphite border-l-2 border-green-500/50 relative overflow-hidden">
            <div class="absolute inset-0 bg-green-500/5 pointer-events-none"></div>
            <p class="text-[10px] text-green-500 font-mono mb-1">SYS_RESPONSE:</p>
            <p class="text-xs text-primary font-mono">${feedback.admin_response}</p>
          </div>
        ` : ''}
      `;

      feedbackHistory.appendChild(feedbackItem);
    });

  } catch (error) {
    console.error('Error loading feedback history:', error);
  }
}

// Show notification matching Obsidian Stream theme
function showNotification(message, type) {
  const notification = document.createElement('div');
  const isError = type === 'error';
  
  notification.className = `fixed top-10 right-10 p-4 border border-raw z-[100] text-primary animate-fade-in flex items-center gap-3 backdrop-blur-md shadow-accent-lg bg-obsidian`;
  
  // Custom styling elements based on type
  if (isError) {
      notification.classList.add('border-red-500');
  }

  const icon = document.createElement('span');
  icon.className = `material-symbols-outlined ${isError ? 'text-red-500' : 'text-accent-signal'}`;
  icon.textContent = isError ? 'error' : 'check_circle';
  
  const text = document.createElement('span');
  text.className = 'font-space-grotesk tracking-wide text-sm';
  text.textContent = message;

  notification.appendChild(icon);
  notification.appendChild(text);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}
