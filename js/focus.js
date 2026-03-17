import { supabase } from './supabase.js';
import { updateRewards } from './rewards.js';

// Focus session variables
let currentSessionId = null;
let remainingSeconds = 25 * 60;

// Initialize focus functionality
export function initFocusTimer() {
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const focusModeBtn = document.getElementById('focus-mode-toggle');
  const exitFocusBtn = document.getElementById('exit-focus-btn');
  const questStatus = document.getElementById('quest-status-dashboard');

  if (!startBtn || !pauseBtn || !resetBtn) return;

  startBtn.addEventListener('click', startFocusSession);
  pauseBtn.addEventListener('click', pauseFocusSession);
  resetBtn.addEventListener('click', resetFocusSession);
  if (focusModeBtn) focusModeBtn.addEventListener('click', toggleFocusMode);
  if (exitFocusBtn) exitFocusBtn.addEventListener('click', toggleFocusMode);

  // Time preset buttons
  document.querySelectorAll('#time-15, #time-25, #time-30, #time-45').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.id.split('-')[1]);
      setSessionDuration(mins);

      // UI update for scroll buttons
      document.querySelectorAll('#time-15, #time-25, #time-30, #time-45').forEach(b => b.classList.remove('active-scroll'));
      btn.classList.add('active-scroll');
    });
  });

  updateTimerDisplay();
  updateProgress();
}

export function setSessionDuration(minutes) {
  if (isSessionRunning) return;
  sessionDurationSeconds = minutes * 60;
  remainingSeconds = sessionDurationSeconds;
  updateTimerDisplay();
  updateProgress();
}

function toggleFocusMode() {
  const isZen = document.body.classList.toggle('focus-mode');
  const exitBtn = document.getElementById('exit-focus-btn');
  const enterBtn = document.getElementById('focus-mode-toggle');
  
  if (isZen) {
    if (enterBtn) enterBtn.classList.add('hidden');
    if (exitBtn) exitBtn.classList.remove('hidden');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
  } else {
    if (enterBtn) enterBtn.classList.remove('hidden');
    if (exitBtn) exitBtn.classList.add('hidden');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(e => console.log(e));
    }
  }
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

  const spellCastSound = document.getElementById('spell-cast-sound');
  if (spellCastSound) spellCastSound.play().catch(e => console.log('Audio error', e));

  isSessionRunning = true;
  
  // If starting a fresh session (not resuming)
  if (!currentSessionId) {
    sessionStartTime = new Date();
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
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
    } catch (error) {
      console.error('Error starting session:', error);
      showNotification('Failed to sync session.', 'error');
    }
  }

  // Update UI
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('pause-btn').style.display = 'flex';

  sessionInterval = setInterval(updateSessionProgress, 1000);
  showNotification(currentSessionId ? 'Resuming focus...' : 'Focus session started!', 'success');
}

// Pause session
function pauseFocusSession() {
  if (!isSessionRunning) return;
  clearInterval(sessionInterval);
  isSessionRunning = false;
  document.getElementById('start-btn').style.display = 'flex';
  document.getElementById('pause-btn').style.display = 'none';
  const questStatus = document.getElementById('quest-status-dashboard');
  if (questStatus) questStatus.textContent = 'FOCUS SUSPENDED';
  showNotification('Session paused.', 'info');
}

// Reset session
async function resetFocusSession() {
  if (currentSessionId) {
    try {
      await supabase.from('focus_sessions').delete().eq('id', currentSessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }
  
  clearInterval(sessionInterval);
  isSessionRunning = false;
  currentSessionId = null;
  sessionStartTime = null;
  remainingSeconds = sessionDurationSeconds;
  
  document.getElementById('start-btn').style.display = 'flex';
  document.getElementById('pause-btn').style.display = 'none';
  const questStatus = document.getElementById('quest-status-dashboard');
  if (questStatus) {
      questStatus.textContent = 'AWAITING CHANNELING';
      questStatus.classList.replace('text-red-500', 'text-arcane-electric');
  }
  updateTimerDisplay();
  updateProgress();
  showNotification('Session reset.', 'info');
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
      return;
    }

    clearInterval(sessionInterval);
    isSessionRunning = false;
    currentSessionId = null;
    sessionStartTime = null;

    document.getElementById('start-btn').style.display = 'flex';
    document.getElementById('pause-btn').style.display = 'none';
    
    const questStatus = document.getElementById('quest-status-dashboard');
    if (questStatus) questStatus.textContent = 'QUEST COMPLETE';
    
    const questCompleteSound = document.getElementById('quest-complete-sound');
    if (questCompleteSound) questCompleteSound.play().catch(e => console.log('Audio disabled', e));

    showNotification(`Session completed! Points earned.`, 'success');

  } catch (error) {
    console.error('Error completing session:', error);
    showNotification('Error finalizing session.', 'error');
  }
}

function updateSessionProgress() {
  if (!isSessionRunning) return;
  
  remainingSeconds--;

  if (remainingSeconds <= 0) {
    completeFocusSession();
    return;
  }
  updateTimerDisplay();
  updateProgress();
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  if (!display) return;

  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  // Update SVG Ring (Mana Bar)
  const focusRingPath = document.getElementById('focus-ring-path-dashboard');
  const questStatus = document.getElementById('quest-status-dashboard');
  if (focusRingPath) {
    const RING_CIRCUMFERENCE = 880;
    const offset = RING_CIRCUMFERENCE - (remainingSeconds / sessionDurationSeconds) * RING_CIRCUMFERENCE;
    focusRingPath.style.strokeDashoffset = offset;

    // Low Mana State (< 5 minutes)
    if (remainingSeconds <= 300 && remainingSeconds > 0 && sessionDurationSeconds > 300) {
        focusRingPath.classList.add('mana-low');
        if (questStatus) {
            questStatus.textContent = "BATTLING DISTRACTIONS...";
            questStatus.classList.replace('text-arcane-electric', 'text-red-500');
        }
    } else {
        focusRingPath.classList.remove('mana-low');
        if (isSessionRunning && questStatus) {
            questStatus.textContent = "CHANNELING FOCUS...";
            questStatus.classList.replace('text-red-500', 'text-arcane-electric');
        }
    }
  }
}

function updateProgress() {
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (!bar || !text) return;
  
  const elapsed = sessionDurationSeconds - remainingSeconds;
  const p = Math.min((elapsed / sessionDurationSeconds) * 100, 100);
  
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
