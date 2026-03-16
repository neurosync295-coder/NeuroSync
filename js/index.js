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

    // Dynamic Latency & System Time
    const latencyVal = document.querySelector('.telemetry-value:last-of-type');
    const systemTimeEl = document.getElementById('system-time');
    const megaContainer = document.querySelector('.asymmetric-hero');

    setInterval(() => {
      // Latency Jitter
      if (latencyVal && Math.random() > 0.8) {
        const base = 12;
        const jitter = Math.random() * 4 - 2;
        latencyVal.textContent = `${(base + jitter).toFixed(1)}ms`;
      }

      // System Time Update
      if (systemTimeEl) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
        systemTimeEl.textContent = `${timeStr} // SYS_UTC`;
      }

      // Pro Max Glitch Trigger
      if (megaContainer && Math.random() > 0.98) {
        megaContainer.classList.add('glitch-active');
        setTimeout(() => megaContainer.classList.remove('glitch-active'), 200);
      }
    }, 1000);
  });

  // ============ NEURAL WEB ENGINE (PRO MAX) ============
  const canvas = document.getElementById('neural-web-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let points = [];
    const pointCount = 60;
    const maxDist = 150;
    let mouse = { x: null, y: null };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints();
    }

    function initPoints() {
      points = [];
      for (let i = 0; i < pointCount; i++) {
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5
        });
      }
    }

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.15)';
      ctx.lineWidth = 0.5;

      points.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Connect to other points
        points.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        // Connect to mouse
        if (mouse.x) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.strokeStyle = `rgba(249, 115, 22, ${1 - dist / 200})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.15)';
          }
        }
      });

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // ============ HUD SECTOR TRACKING (PRO MAX) ============
  const hudIndicator = document.getElementById('hud-sector-indicator');
  if (hudIndicator) {
    const sections = [
      { id: 'CORE_01', el: document.querySelector('.asymmetric-hero') },
      { id: 'STREAM_02', el: document.querySelector('.stream-section') },
      { id: 'ENGINE_03', el: document.getElementById('focus-timer') },
      { id: 'VAULT_04', el: document.querySelector('.bg-[#0D0D0E].border-y') },
      { id: 'RELAY_05', el: document.querySelector('.py-32.px-6:last-of-type') }
    ];

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      sections.forEach(sec => {
        if (sec.el) {
          const top = sec.el.offsetTop;
          const height = sec.el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            hudIndicator.textContent = `SECTOR_ID // ${sec.id}`;
          }
        }
      });
    });
  }

  // ============ POMODORO ENGINE ============
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const focusRingPath = document.getElementById('focus-ring-path');

  let selectedTime = 25 * 60;
  let timeLeft = selectedTime;
  let isRunning = false;
  let timerInterval;

  const RING_CIRCUMFERENCE = 880; // stroke-dasharray value

  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update SVG Ring
    const offset = RING_CIRCUMFERENCE - (timeLeft / selectedTime) * RING_CIRCUMFERENCE;
    focusRingPath.style.strokeDashoffset = offset;
  }

  window.setTimer = function (minutes) {
    selectedTime = minutes * 60;
    timeLeft = selectedTime;
    resetTimer();

    // Update active button state
    document.querySelectorAll('.obsidian-button[onclick^="setTimer"]').forEach(btn => {
      btn.classList.remove('border-[var(--accent-signal)]');
    });
    event.currentTarget.classList.add('border-[var(--accent-signal)]');
  };

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'flex';
      timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          startBtn.style.display = 'flex';
          pauseBtn.style.display = 'none';
          alert('Synchronization Complete.');
        }
      }, 1000);
    }
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = selectedTime;
    updateDisplay();
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
  }

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  // ============ THEME MANAGEMENT ============
  // Force dark mode for Obsidian Stream aesthetic
  document.body.classList.add('dark');
  document.body.classList.remove('light');

  // ============ AUTH STATE SYNC (SUPABASE) ============
  import('/js/supabase.js').then(async ({ supabase }) => {
    const { getThresholdForLevel, getLevelName } = await import('./rewards.js');
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      const loggedOutActions = document.getElementById('logged-out-actions');
      const loggedInGreeting = document.getElementById('logged-in-greeting');
      const userGreetingName = document.getElementById('user-greeting-name');
      const activityRelay = document.getElementById('activity-relay');

      if (user) {
        // Show Logged-In Experience
        if (loggedOutActions) loggedOutActions.classList.add('hidden');
        if (loggedInGreeting) {
          loggedInGreeting.classList.remove('hidden');
          loggedInGreeting.classList.add('flex');
        }
        if (activityRelay) activityRelay.classList.remove('hidden');
        
        // Show Evolution Section for logged-in users
        const evolutionSection = document.getElementById('evolution-section');
        if (evolutionSection) evolutionSection.classList.remove('hidden');

        // Fetch Profile for Greeting
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (profile && userGreetingName) {
          userGreetingName.textContent = `Welcome back, ${profile.first_name}`;
        }

        // Fetch and Update Progression Data
        loadProgressionData(user.id, supabase, getThresholdForLevel, getLevelName);

        // Load Activity Logs
        loadRecentActivity(user.id, supabase);
      } else {
        if (loggedOutActions) loggedOutActions.classList.remove('hidden');
        if (loggedInGreeting) {
          loggedInGreeting.classList.add('hidden');
          loggedInGreeting.classList.remove('flex');
        }
        if (activityRelay) activityRelay.classList.add('hidden');

        // Hide Evolution Section for guests
        const evolutionSection = document.getElementById('evolution-section');
        if (evolutionSection) evolutionSection.classList.add('hidden');
      }
    });

    async function loadProgressionData(userId, supabase, getThreshold, getLevelName) {
      try {
        const { data: rewards } = await supabase
          .from('rewards')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (rewards) {
          const levelDisplay = document.getElementById('index-level-display');
          const nextLevelName = document.getElementById('index-next-level-name');
          const progressBar = document.getElementById('index-evolution-progress');

          const lvl = rewards.avatar_level || 1;
          const points = rewards.total_points || 0;
          const currentThreshold = getThreshold(lvl);
          const nextThreshold = getThreshold(lvl + 1);
          const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

          if (levelDisplay) levelDisplay.textContent = `LVL_0${lvl} - ${getLevelName(lvl)}`;
          if (nextLevelName) nextLevelName.textContent = getLevelName(lvl + 1);
          if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
        }
      } catch (err) {
        console.error('Error loading progression data:', err);
      }
    }

    async function loadRecentActivity(userId, supabase) {
      const container = document.getElementById('activity-logs-container');
      if (!container) return;

      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching activity:', error);
        return;
      }

      container.innerHTML = '';
      if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="p-12 text-center text-secondary col-span-full italic">No synchronization logs found.</div>';
        return;
      }

      logs.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString();
        const item = document.createElement('div');
        item.className = 'bg-[#161618] p-8 border border-[var(--border-raw)] hover:border-accent/40 transition-colors group';
        item.innerHTML = `
          <div class="telemetry-label !text-[8px] mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
            LOG_ID // ${log.id.substring(0, 8).toUpperCase()}
          </div>
          <div class="flex items-center gap-4 mb-4">
            <div class="size-2 bg-accent animate-pulse"></div>
            <span class="text-xs font-bold tracking-widest uppercase">${log.action}</span>
          </div>
          <p class="text-secondary text-[11px] mb-2">${log.target || 'System Operation'}</p>
          <div class="flex justify-between items-center mt-6">
            <span class="text-accent text-[10px] font-mono">+${log.points_earned} PTS</span>
            <span class="text-secondary text-[9px] font-mono">${date}</span>
          </div>
        `;
        container.appendChild(item);
      });
    }
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
