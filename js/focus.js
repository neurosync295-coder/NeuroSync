import { supabase } from './supabase.js';
import { updateRewards } from './rewards.js';

// Focus session variables
let currentSessionId = null;
let sessionStartTime = null;
let sessionInterval = null;
let isSessionRunning = false;
let sessionDurationSeconds = 25 * 60; // Default

// Initialize focus functionality
export function initFocusTimer() {
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (!startBtn || !pauseBtn || !resetBtn) return;

  startBtn.addEventListener('click', startFocusSession);
  pauseBtn.addEventListener('click', pauseFocusSession);
  resetBtn.addEventListener('click', resetFocusSession);

  // Time preset buttons
  document.querySelectorAll('#time-15, #time-25, #time-30, #time-45').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.id.split('-')[1]);
      setSessionDuration(mins);

      // UI update for buttons
      document.querySelectorAll('#time-15, #time-25, #time-30, #time-45').forEach(b => b.classList.remove('bg-accent', 'text-primary'));
      btn.classList.add('bg-accent', 'text-primary');
    });
  });

  updateTimerDisplay();
  updateProgress();
}

export function setSessionDuration(minutes) {
  if (isSessionRunning) return;
  sessionDurationSeconds = minutes * 60;
  updateTimerDisplay();
  updateProgress();
}

// Start a focus session
async function startFocusSession() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    showNotification('Please log in to start a focus session.', 'error');
    return;
  }

  if (isSessionRunning) return;

  isSessionRunning = true;
  sessionStartTime = new Date();

  try {
    const { data, error } = await supabase
      .insert({
        user_id: user.id,
        start_time: sessionStartTime.toISOString(),
        duration_minutes: 0,
        target_duration_minutes: sessionDurationSeconds / 60,
        completed: false,
        session_type: 'Focus'
      })
      .select()
      .single();

    if (error) throw error;
    currentSessionId = data.id;

    // Update UI
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'flex';

    sessionInterval = setInterval(updateSessionProgress, 1000);
    showNotification('Focus session started!', 'success');

  } catch (error) {
    console.error('Error starting session:', error);
    showNotification('Failed to start session.', 'error');
    isSessionRunning = false;
  }
}

// Pause session
function pauseFocusSession() {
  if (!isSessionRunning) return;
  clearInterval(sessionInterval);
  isSessionRunning = false;
  document.getElementById('start-btn').style.display = 'flex';
  document.getElementById('pause-btn').style.display = 'none';
  showNotification('Session paused.', 'info');
}

// Reset session
async function resetFocusSession() {
  if (!currentSessionId) return;
  try {
    await supabase.from('focus_sessions').delete().eq('id', currentSessionId);
    clearInterval(sessionInterval);
    isSessionRunning = false;
    currentSessionId = null;
    sessionStartTime = null;
    document.getElementById('start-btn').style.display = 'flex';
    document.getElementById('pause-btn').style.display = 'none';
    updateTimerDisplay();
    updateProgress();
    showNotification('Session reset.', 'info');
  } catch (error) {
    console.error('Error resetting session:', error);
  }
}

// Complete session (Secure RPC version)
async function completeFocusSession() {
  if (!currentSessionId) return;

  try {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const user = authSession?.user;
    if (!user) return;

    // Call secure RPC to verify and complete
    const { data, error } = await supabase.rpc('complete_focus_session', {
      session_id: currentSessionId
    });

    if (error) throw error;

    if (data && !data.success) {
      showNotification(data.message, 'error');
      // If they cheated, we don't clear the interval, let them continue or reset
      return;
    }

    clearInterval(sessionInterval);
    isSessionRunning = false;
    currentSessionId = null;
    sessionStartTime = null;

    document.getElementById('start-btn').style.display = 'flex';
    document.getElementById('pause-btn').style.display = 'none';
    showNotification(`Session completed! Points earned.`, 'success');

  } catch (error) {
    console.error('Error completing session:', error);
    showNotification('Error finalizing session.', 'error');
  }
}

function updateSessionProgress() {
  if (!sessionStartTime) return;
  const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);

  if (elapsed >= sessionDurationSeconds) {
    completeFocusSession();
    return;
  }
  updateTimerDisplay();
  updateProgress();
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  if (!display) return;

  let remaining = sessionDurationSeconds;
  if (sessionStartTime && isSessionRunning) {
    const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);
    remaining = Math.max(sessionDurationSeconds - elapsed, 0);
  }

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateProgress() {
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (!bar || !text) return;
  let p = 0;
  if (sessionStartTime && isSessionRunning) {
    const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);
    p = Math.min((elapsed / sessionDurationSeconds) * 100, 100);
  }
  bar.style.width = `${p}%`;
  text.textContent = `${Math.round(p)}%`;
}

function showNotification(msg, type) {
  const n = document.createElement('div');
  n.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

export async function loadFocusStats() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  try {
    const { data: sessions, error } = await supabase
      .from('focus_sessions')
      .select('duration_minutes')
      .eq('user_id', session.user.id)
      .eq('completed', true);

    if (error) throw error;

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    const sElem = document.getElementById('total-sessions');
    const mElem = document.getElementById('total-minutes');
    if (sElem) sElem.textContent = totalSessions;
    if (mElem) mElem.textContent = totalMinutes;

  } catch (error) {
    console.error('Error loading focus stats:', error);
  }
}
