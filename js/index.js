// NeuroSync Obsidian Stream Interactivity

document.addEventListener('DOMContentLoaded', function () {
  // ============ REVEAL ON SCROLL ============
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => revealObserver.observe(el));

  // ============ MOUSE PARALLAX ============
  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const moveX = (clientX - centerX) / 50;
    const moveY = (clientY - centerY) / 50;

    const megaText = document.querySelector('.text-mega');
    if (megaText) {
      megaText.style.transform = `translate(${moveX * 2}px, ${moveY * 2}px)`;
    }

    const sprite = document.querySelector('.asymmetric-hero .relative.group');
    if (sprite) {
      sprite.style.transform = `translate(${-moveX}px, ${-moveY}px)`;
    }
  });

  // ============ GAMIFIED POMODORO ENGINE ============
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const focusRingPath = document.getElementById('focus-ring-path');
  const questStatus = document.getElementById('quest-status');

  // Audio Elements
  const spellCastSound = document.getElementById('spell-cast-sound');
  const questCompleteSound = document.getElementById('quest-complete-sound');

  // XP & Level Elements
  const currentLevelDisplay = document.getElementById('current-level-display');
  const currentXpDisplay = document.getElementById('current-xp-display');
  const nextLevelXpDisplay = document.getElementById('next-level-xp-display');
  const xpProgressBar = document.getElementById('xp-progress-bar');
  const victoryBanner = document.getElementById('victory-banner');
  const victoryBannerContent = document.getElementById('victory-banner-content');
  const earnedXpDisplay = document.getElementById('earned-xp');
  const victoryParticles = document.getElementById('victory-particles');

  let selectedTime = 15 * 60;
  let timeLeft = selectedTime;
  let isRunning = false;
  let timerInterval;

  const RING_CIRCUMFERENCE = 880; // stroke-dasharray value

  // XP System Logic
  let xp = parseInt(localStorage.getItem('neurosync_xp')) || 0;
  let level = parseInt(localStorage.getItem('neurosync_level')) || 1;
  const XP_PER_MINUTE = 10;

  function getXpForNextLevel(currentLevel) {
    return currentLevel * 1000;
  }

  function updateXpUI() {
    currentLevelDisplay.textContent = level;
    currentXpDisplay.textContent = xp;
    const nextXp = getXpForNextLevel(level);
    nextLevelXpDisplay.textContent = nextXp;

    // Previous level requirements calculate the base of the bar
    let prevLevelXp = level > 1 ? getXpForNextLevel(level - 1) : 0;
    // For visual progress relative to ONLY this current level gap
    let xpInCurrentLevel = xp;
    if (level > 1) {
      // Simple scale: if level > 1, total XP needed for next level is actually just nextXp. 
      // We will just show total XP / nextXp ratio for simplicity
    }

    const progressPercent = Math.min((xp / nextXp) * 100, 100);
    xpProgressBar.style.width = `${progressPercent}%`;
  }

  async function addXp(minutesCompleted) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    // Determine activity type based on minutes
    let activityType = 'focus';
    if (minutesCompleted === 15) activityType = 'focus_15';
    else if (minutesCompleted === 30) activityType = 'focus_30';
    else if (minutesCompleted === 45) activityType = 'focus_45';
    else if (minutesCompleted === 60) activityType = 'focus_60';

    if (user) {
      const { updateRewards } = await import('./rewards.js');
      const result = await updateRewards(user.id, activityType);
      
      if (result.success) {
        // Sync local storage and UI with what backend says (optional, but keep it for immediate feel)
        // Note: The RPC returns total_points and level, we could use those directly
        // But for consistency with the rest of the file's XP logic:
        const earned = result.pointsAdded;
        xp += earned;
        
        // Ensure level up is handled locally too for immediate feedback
        const nextXp = getXpForNextLevel(level);
        if (xp >= nextXp) {
          level++;
          xp = xp - nextXp;
        }
        
        localStorage.setItem('neurosync_xp', xp);
        localStorage.setItem('neurosync_level', level);
        updateXpUI();
        return earned;
      }
    } else {
      // Fallback for anonymous users or if sync fails
      const earned = minutesCompleted * XP_PER_MINUTE;
      xp += earned;
      const nextXp = getXpForNextLevel(level);
      if (xp >= nextXp) {
        level++;
        xp = xp - nextXp;
      }
      localStorage.setItem('neurosync_xp', xp);
      localStorage.setItem('neurosync_level', level);
      updateXpUI();
      return earned;
    }
    return 0;
  }

  updateXpUI();

  function triggerVictory(earned) {
    if (questCompleteSound) questCompleteSound.play().catch(e => console.log('Audio disabled', e));

    // Particles burst
    victoryParticles.classList.remove('hidden');
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.classList.add('golden-particle');
      particle.style.left = '50%';
      particle.style.top = '50%';

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 200 + 50;
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);

      particle.style.animationDuration = `${Math.random() * 1 + 0.5}s`;
      victoryParticles.appendChild(particle);
    }

    // Cleanup particles
    setTimeout(() => {
      victoryParticles.innerHTML = '';
      victoryParticles.classList.add('hidden');
    }, 2000);

    // Show Banner
    earnedXpDisplay.textContent = earned;
    victoryBanner.classList.remove('opacity-0', 'pointer-events-none');
    victoryBannerContent.classList.remove('scale-90');
    victoryBannerContent.classList.add('scale-100');

    // Hide banner on click anywhere
    const hideBanner = () => {
      victoryBanner.classList.add('opacity-0', 'pointer-events-none');
      victoryBannerContent.classList.remove('scale-100');
      victoryBannerContent.classList.add('scale-90');
      document.removeEventListener('click', hideBanner);
    };

    setTimeout(() => {
      document.addEventListener('click', hideBanner);
    }, 500);
  }

  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update SVG Ring (Mana Bar)
    const offset = RING_CIRCUMFERENCE - (timeLeft / selectedTime) * RING_CIRCUMFERENCE;
    focusRingPath.style.strokeDashoffset = offset;

    // Low Mana State (Under 5 minutes remaining, and selected time > 5 min to not trigger instantly on 5m timers)
    if (timeLeft <= 300 && timeLeft > 0 && selectedTime > 300) {
        focusRingPath.classList.add('mana-low');
        if (questStatus) {
            questStatus.textContent = "BATTLING DISTRACTIONS...";
            questStatus.classList.replace('text-gray-400', 'text-red-500');
        }
    } else {
        focusRingPath.classList.remove('mana-low');
        if (isRunning && questStatus) {
            questStatus.textContent = "CHANNELING FOCUS...";
            questStatus.classList.replace('text-red-500', 'text-gray-400');
        }
    }
  }

  window.setTimer = function (minutes) {
    selectedTime = minutes * 60;
    timeLeft = selectedTime;
    resetTimer();

    // Update active button state (Quest Scrolls)
    document.querySelectorAll('.quest-scroll').forEach(btn => {
      btn.classList.remove('active-scroll');
    });
    const target = event?.currentTarget || event?.target;
    if (target) target.classList.add('active-scroll');
  };

  function startTimer() {
    if (!isRunning) {
      if (spellCastSound) spellCastSound.play().catch(e => console.log('Audio disabled', e));

      isRunning = true;
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'flex';
      questStatus.textContent = "CHANNELING FOCUS...";
      questStatus.classList.replace('text-red-500', 'text-gray-400'); // Ensure proper color on restart

      timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          startBtn.style.display = 'flex';
          pauseBtn.style.display = 'none';
          questStatus.textContent = "QUEST COMPLETE";

          const earned = addXp(selectedTime / 60);
          triggerVictory(earned);
        }
      }, 1000);
    }
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
    questStatus.textContent = "FOCUS SUSPENDED";
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = selectedTime;
    updateDisplay();
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
    if (questStatus) {
      questStatus.textContent = 'AWAITING CHANNELING';
      questStatus.classList.replace('text-red-500', 'text-gray-400');
  }
  }

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  // ============ THEME MANAGEMENT ============
  // Force dark mode for Obsidian Stream aesthetic
  document.body.classList.add('dark');
  document.body.classList.remove('light');

  // ============ AUTH STATE SYNC (SUPABASE) ============
  import('./supabase.js').then(({ supabase }) => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      const connectBtn = document.querySelector('a[href*="auth.html"]');

      if (user) {
        if (connectBtn) {
          connectBtn.textContent = 'Dashboard';
          connectBtn.href = 'html/dashboard.html';
        }
      } else {
        if (connectBtn) {
          connectBtn.textContent = 'Connect';
          connectBtn.href = 'html/auth.html';
        }
      }
    });
  }).catch(e => console.warn('Supabase not available in index.js', e));

  // ============ COMMENT SYSTEM (SUPABASE) ============
  const commentForm = document.getElementById('comment-form');
  const commentsDisplay = document.getElementById('comments-display');
  const nameInput = document.getElementById('name-input');
  const commentInput = document.getElementById('comment-input');
  const postIdInput = document.getElementById('postId-input');

  // Dynamically import comment service to keep it clean
  async function initComments() {
    const { addComment, getComments } = await import('./comment.js');

    async function loadHomepageComments() {
      const postId = postIdInput?.value || 'homepage';
      const { success, data, error } = await getComments(postId);

      if (success) {
        commentsDisplay.innerHTML = '';
        if (data.length === 0) {
          commentsDisplay.innerHTML = '<p class="text-secondary text-center italic">No logs found in this sector.</p>';
        } else {
          data.forEach(comment => {
            const date = new Date(comment.created_at).toLocaleDateString();
            const commentEl = document.createElement('div');
            commentEl.className = 'bg-[#161618] border border-[var(--border-raw)] p-6 reveal-on-scroll';

            const headerEl = document.createElement('div');
            headerEl.className = 'flex justify-between items-start mb-4';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'text-[var(--accent-signal)] font-bold tracking-widest text-[10px] uppercase';
            nameSpan.textContent = `Log Entry: ${comment.user_name}`;

            const dateSpan = document.createElement('span');
            dateSpan.className = 'text-secondary text-[10px] font-mono';
            dateSpan.textContent = date;

            headerEl.appendChild(nameSpan);
            headerEl.appendChild(dateSpan);

            const contentP = document.createElement('p');
            contentP.className = 'text-primary text-sm leading-relaxed';
            contentP.textContent = comment.content;

            commentEl.appendChild(headerEl);
            commentEl.appendChild(contentP);

            commentsDisplay.appendChild(commentEl);
          });
        }
      } else {
        console.error('Failed to load comments:', error);
      }
    }

    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const text = commentInput.value.trim();
        const postId = postIdInput.value;
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'anonymous';

        if (!name || !text) {
          alert('Identification and Message required.');
          return;
        }

        const submitBtn = commentForm.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting...';

        const { success, error } = await addComment(postId, userId, name, text);

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (success) {
          nameInput.value = '';
          commentInput.value = '';
          loadHomepageComments();
        } else {
          alert('Transmission failure: ' + error);
        }
      });
    }

    loadHomepageComments();
  }

  initComments();

  updateDisplay();
});
