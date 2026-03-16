import { supabase } from './supabase.js';

// Initialize rewards functionality
export function initRewards() {
  loadRewardsData();
}

// Load and display rewards data
export async function loadRewardsData() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  try {
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (rewards) {
      // Update points display
      const pointsElement = document.getElementById('total-points');
      if (pointsElement) pointsElement.textContent = rewards.total_points || 0;

      // Update level display
      const levelNum = rewards.avatar_level || 1;
      const levelElement = document.getElementById('current-level');
      const bgLevelElement = document.getElementById('bg-level-display');

      if (levelElement) levelElement.textContent = `Lvl ${levelNum} - ${getLevelName(levelNum)}`;
      if (bgLevelElement) bgLevelElement.textContent = levelNum < 10 ? `0${levelNum}` : levelNum;

      // Update progress bar
      updateLevelProgress(rewards.total_points || 0, rewards.avatar_level || 1);

      // Update badges
      await displayBadges(user.id);

      // Update statistics
      await loadRewardsStats(user.id);

    } else {
      // Initialize default rewards in Supabase if not exists
      await supabase.from('rewards').insert([{ user_id: user.id, total_points: 0, avatar_level: 1 }]);
      setDefaultRewardsDisplay();
    }
  } catch (error) {
    console.error('Error loading rewards:', error);
    setDefaultRewardsDisplay();
  }
}

// Set default rewards display for new users
function setDefaultRewardsDisplay() {
  const pointsElement = document.getElementById('total-points');
  const levelElement = document.getElementById('current-level');
  const bgLevelElement = document.getElementById('bg-level-display');
  const progressBar = document.getElementById('level-progress-bar');

  if (pointsElement) pointsElement.textContent = '0';
  if (levelElement) levelElement.textContent = 'Lvl 1';
  if (bgLevelElement) bgLevelElement.textContent = '01';
  if (progressBar) progressBar.style.width = '0%';
}

// Update level progress bar
function updateLevelProgress(points, currentLevel) {
  const progressBar = document.getElementById('level-progress-bar');
  const progressText = document.getElementById('level-progress-text');

  if (!progressBar) return;

  const currentThreshold = getThresholdForLevel(currentLevel);
  const nextThreshold = getThresholdForLevel(currentLevel + 1);

  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  progressBar.style.width = `${clampedProgress}%`;

  if (progressText) {
    progressText.textContent = `${Math.round(clampedProgress)}% to Level ${currentLevel + 1} (${points}/${nextThreshold} XP)`;
  }
}

// Helper to get total XP required for a specific level
export function getThresholdForLevel(level) {
  const baseThresholds = [0, 50, 150, 350, 600, 1000, 1500]; // L1-L7
  // Cap at level 7
  const cappedLevel = Math.min(Math.max(level, 1), 7);
  return baseThresholds[cappedLevel - 1];
}

// Helper to get level name
export function getLevelName(level) {
  const names = [
    'Beginner',
    'Newbie',
    'Emerge',
    'Enthusiast',
    'Advance',
    'Absolute',
    'Experienced'
  ];
  const cappedLevel = Math.min(Math.max(level, 1), names.length);
  return names[cappedLevel - 1];
}

// Calculate avatar level based on points
export function calculateLevel(points) {
  let level = 1;
  while (points >= getThresholdForLevel(level + 1)) {
    level++;
  }
  return level;
}

// Display earned badges
async function displayBadges(userId) {
  const badgesContainer = document.getElementById('badges-container');
  if (!badgesContainer) return;

  try {
    const { data: badges, error } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    badgesContainer.innerHTML = '';

    if (!badges || badges.length === 0) {
      badgesContainer.innerHTML = '<p class="text-secondary text-center">No badges earned yet. Keep using NeuroSync to unlock achievements!</p>';
      return;
    }

    badges.forEach(badge => {
      const badgeElement = document.createElement('div');
      badgeElement.className = 'border border-primary/50 aspect-square flex flex-col items-center justify-center text-center p-4 bg-primary/5 group relative overflow-hidden transition-all hover:bg-primary/10 hover:border-accent/50';
      badgeElement.innerHTML = `
        <div class="absolute inset-x-0 bottom-0 h-1 bg-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        <div class="text-3xl mb-3 grayscale group-hover:grayscale-0 transition-all duration-300 scale-90 group-hover:scale-110">${getBadgeIcon(badge.type)}</div>
        <h3 class="font-bold text-primary text-xs uppercase tracking-widest leading-tight mb-1">${badge.name}</h3>
        <p class="text-[10px] text-secondary hidden sm:block">${badge.description}</p>
      `;
      badgesContainer.appendChild(badgeElement);
    });
  } catch (error) {
    console.error('Error loading badges:', error);
  }
}

// Get badge icon based on type
function getBadgeIcon(type) {
  const icons = {
    'first_mood': '😊',
    'focus_master': '🎯',
    'study_sharer': '📚',
    'consistent': '⭐',
    'early_bird': '🌅'
  };
  return icons[type] || '🏆';
}

// Load rewards statistics from Supabase
async function loadRewardsStats(userId) {
  try {
    // Moods count
    const { count: moodCount, error: moodError } = await supabase
      .from('moods')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Focus Sessions count
    const { count: focusCount, error: focusError } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    // Study Materials 
    const studyCount = 0;

    // Update stats display for new brutalist layout
    const statsContainer = document.getElementById('rewards-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="relative group cursor-default">
            <div class="absolute -inset-2 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="text-xs text-secondary uppercase tracking-[0.2em]">Day Streak</div>
            <div class="text-4xl font-black text-primary">0</div>
        </div>
        <div class="relative group cursor-default">
            <div class="absolute -inset-2 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="text-xs text-secondary uppercase tracking-[0.2em]">Focus Sessions</div>
            <div class="text-4xl font-black text-primary">${focusCount || 0}</div>
        </div>
        <div class="relative group cursor-default">
            <div class="absolute -inset-2 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="text-xs text-secondary uppercase tracking-[0.2em]">Moods Logged</div>
            <div class="text-4xl font-black text-primary">${moodCount || 0}</div>
        </div>
        <div class="relative group cursor-default">
            <div class="absolute -inset-2 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="text-xs text-secondary uppercase tracking-[0.2em]">Contributions</div>
            <div class="text-4xl font-black text-primary">${studyCount}</div>
        </div>
      `;
    }

  } catch (error) {
    console.error('Error loading rewards stats:', error);
  }
}

// Check and award new badges in Supabase
export async function checkAndAwardBadges(userId) {
  try {
    const { data: currentBadges, error: badgeError } = await supabase
      .from('badges')
      .select('type')
      .eq('user_id', userId);

    if (badgeError) throw badgeError;

    const earnedTypes = new Set(currentBadges.map(b => b.type));
    const newBadges = [];

    // Check mood badge
    if (!earnedTypes.has('first_mood')) {
      const { count: mCount } = await supabase
        .from('moods')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (mCount > 0) {
        newBadges.push({
          user_id: userId,
          type: 'first_mood',
          name: 'Mood Tracker',
          description: 'Logged your first mood'
        });
      }
    }

    // Check focus master badge
    if (!earnedTypes.has('focus_master')) {
      const { count: fCount } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);

      if (fCount >= 5) {
        newBadges.push({
          user_id: userId,
          type: 'focus_master',
          name: 'Focus Master',
          description: 'Completed 5 focus sessions'
        });
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      const { error } = await supabase.from('badges').insert(newBadges);
      if (error) throw error;
      loadRewardsData();
    }

  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

// Update rewards points and recalculate level in Supabase (Secure RPC version)
export async function updateRewards(userId, activityType) {
  try {
    const { data, error } = await supabase.rpc('add_points', {
      activity_type: activityType
    });

    if (error) throw error;

    if (data && !data.success) {
      console.warn('Point addition rejected:', data.message);
      return { success: false, message: data.message };
    }

    // Check for level up or badges
    await checkAndAwardBadges(userId);

    // Update UI if we are on the rewards page
    if (window.location.pathname.includes('rewards.html')) {
      loadRewardsData();
    }

    return { success: true, pointsAdded: data.points_added };

  } catch (error) {
    console.error('Error updating rewards:', error);
    return { success: false, error: error.message };
  }
}
