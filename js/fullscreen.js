/**
 * Fullscreen API utility for NeuroSync Focus Timers
 */

export function toggleTimerFullscreen(elementId, buttonId) {
  const element = document.getElementById(elementId);
  const button = document.getElementById(buttonId);
  const icon = button ? button.querySelector('.material-symbols-outlined') : null;

  if (!element) return;

  if (!document.fullscreenElement) {
    element.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    document.exitFullscreen();
  }
}

// Function to update icon state
function updateFullscreenIcon(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  const icon = button.querySelector('.material-symbols-outlined');
  if (!icon) return;

  if (document.fullscreenElement) {
    icon.textContent = 'close_fullscreen';
    button.title = 'Exit Fullscreen';
  } else {
    icon.textContent = 'open_in_full';
    button.title = 'Enter Fullscreen';
  }
}

// Global exposure for non-module scripts if needed, or register listeners
document.addEventListener('fullscreenchange', () => {
  // Update icons for all possible fullscreen buttons
  const buttons = ['fullscreen-toggle-home', 'fullscreen-toggle-dashboard'];
  buttons.forEach(updateFullscreenIcon);
});

// Event listener setup helper
export function initFullscreenButton(elementId, buttonId) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.addEventListener('click', () => toggleTimerFullscreen(elementId, buttonId));
  }
}

// Auto-init if IDs are found
document.addEventListener('DOMContentLoaded', () => {
  initFullscreenButton('focus-timer', 'fullscreen-toggle-home');
  // For dashboard, it might be nested-id. We handle based on page.
  const dashboardTimer = document.querySelector('[data-focus-section]');
  if (dashboardTimer && !dashboardTimer.id) {
    dashboardTimer.id = 'focus-timer-dashboard';
  }
  initFullscreenButton('focus-timer-dashboard', 'fullscreen-toggle-dashboard');
});
