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
            commentEl.innerHTML = `
              <div class="flex justify-between items-start mb-4">
                <span class="text-[var(--accent-signal)] font-bold tracking-widest text-[10px] uppercase">Log Entry: ${comment.user_name}</span>
                <span class="text-secondary text-[10px] font-mono">${date}</span>
              </div>
              <p class="text-primary text-sm leading-relaxed">${comment.content}</p>
            `;
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
