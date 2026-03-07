/**
 * NeuroSync Universal Navbar (The Horizon)
 * Handles dynamic top-bar injection and user state synchronization across all pages.
 */

// Capture script base URL for robust relative imports
const NAVBAR_SCRIPT_SRC = document.currentScript ? document.currentScript.src : '';
const NAVBAR_SCRIPT_BASE = NAVBAR_SCRIPT_SRC.substring(0, NAVBAR_SCRIPT_SRC.lastIndexOf('/') + 1);

document.addEventListener('DOMContentLoaded', () => {
    initUniversalNavbar();
});

async function initUniversalNavbar() {
    // Determine path prefix based on location
    const isInHtmlDir = window.location.pathname.includes('/html/');
    const pfx = isInHtmlDir ? '../' : './';
    const htmlPfx = isInHtmlDir ? '' : 'html/';

    console.log(`[Navbar] Init: isInHtmlDir=${isInHtmlDir}, pfx=${pfx}`);

    const navbarHTML = `
        <header id="universal-navbar" class="fixed top-0 left-0 right-0 z-40 h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl">
            <div class="max-w-[1600px] mx-auto h-full px-6 flex items-center justify-between">
                <!-- Left: Branding & Site Trigger -->
                <div class="flex items-center gap-6">
                    <button id="mobile-menu-btn" class="flex items-center justify-center p-2 -ml-2 hover:bg-white/5 transition-colors group">
                        <span class="material-symbols-outlined text-white/50 group-hover:text-red-500 transition-colors">menu</span>
                    </button>
                    <a href="${pfx}index.html" class="flex items-center gap-3 group">
                        <img src="${pfx}assets/Navbar_logo copy.png" alt="NeuroSync Logo" class="h-6 w-auto grayscale contrast-125 group-hover:grayscale-0 transition-all">
                        <span class="hidden md:block text-[10px] font-black tracking-[0.4em] uppercase text-white/30 group-hover:text-white transition-colors">NeuroSync // Horizon</span>
                    </a>
                </div>

                <!-- Center: Primary Navigation (Desktop) -->
                <nav class="hidden lg:flex items-center gap-8">
                    <a href="${htmlPfx}dashboard.html" class="nav-link-std">Dashboard</a>
                    <a href="${htmlPfx}study-library.html" class="nav-link-std">Archive</a>
                    <a href="${htmlPfx}rewards.html" class="nav-link-std">Rewards</a>
                    <a href="${htmlPfx}about.html" class="nav-link-std">Collective</a>
                </nav>

                <!-- Right: Profile & Controls -->
                <div class="flex items-center gap-4">
                    <!-- Profile Preview -->
                    <div id="nav-profile-preview" class="hidden sm:flex items-center gap-3 px-3 py-1.5 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer group/profile" onclick="window.location.href='${htmlPfx}profile.html'">
                        <div class="flex flex-col items-end">
                            <span id="nav-user-name" class="text-[10px] font-bold text-white/80 group-hover/profile:text-white">Loading...</span>
                            <span id="nav-user-role" class="text-[8px] font-black tracking-widest text-white/20 uppercase">Student</span>
                        </div>
                        <div id="nav-user-photo" class="size-8 border border-white/10 bg-center bg-cover bg-no-repeat grayscale group-hover/profile:grayscale-0 group-hover/profile:border-red-500 transition-all">
                            <span class="material-symbols-outlined text-sm text-white/20 flex items-center justify-center h-full w-full">person</span>
                        </div>
                    </div>

                    <!-- Theme Toggle -->
                    <button id="nav-theme-toggle" class="size-10 flex items-center justify-center border border-white/10 hover:border-red-500 transition-colors">
                        <span class="material-symbols-outlined text-sm text-white/50">dark_mode</span>
                    </button>

                    <!-- Auth Action (Login/Connect if not logged in) -->
                    <a href="${htmlPfx}auth.html" id="nav-auth-btn" class="hidden h-10 px-6 items-center justify-center bg-red-600 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                        Connect
                    </a>
                </div>
            </div>

            <!-- Standard Nav Styles -->
            <style>
                .nav-link-std {
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.3em;
                    color: rgba(255, 255, 255, 0.4);
                    transition: all 0.3s;
                    position: relative;
                }
                .nav-link-std:hover {
                    color: #FFFFFF;
                }
                .nav-link-std.is-active {
                    color: #EF4444; /* Signal Red */
                }
                .nav-link-std.is-active::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 0;
                    width: 100%;
                    height: 1px;
                    background: #EF4444;
                }
            </style>
        </header>

        <!-- Spacer for content -->
        <div class="h-16 w-full"></div>
    `;

    // Inject Navbar
    const navContainer = document.createElement('div');
    navContainer.id = 'universal-navbar-container';
    document.body.prepend(navContainer);
    navContainer.innerHTML = navbarHTML;

    // Initialize Functionality
    highlightActiveLink();
    setupAuthSync(pfx);
    setupThemeToggle();

    // TRIGGER SIDE MENU INTERACTIVITY
    // Ensure side menu is ready to handle the hamburger button injection
    if (typeof window.initSideMenuInteractivity === 'function') {
        window.initSideMenuInteractivity();
    }
}

function highlightActiveLink() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-link-std');
    links.forEach(link => {
        const href = link.getAttribute('href').split('/').pop();
        if (href === path) {
            link.classList.add('is-active');
        }
    });
}

function setupAuthSync(pfx) {
    const importPath = NAVBAR_SCRIPT_BASE ? `${NAVBAR_SCRIPT_BASE}supabase.js` : './supabase.js';
    import(importPath).then(({ supabase }) => {
        // Initial Session Check
        handleAuthState(null, null, supabase);

        supabase.auth.onAuthStateChange(async (event, session) => {
            handleAuthState(event, session, supabase);
        });
    });
}

async function handleAuthState(event, session, supabase) {
    // If session is null, try to get it manually first
    if (!session) {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            session = data?.session;
        } catch (err) {
            console.warn('[Navbar] Session fetch error (likely lock contention):', err.message);
            // If we hit a lock error, wait a bit and try one last time
            if (err.message.includes('Lock')) {
                await new Promise(r => setTimeout(r, 1000));
                const { data } = await supabase.auth.getSession();
                session = data?.session;
            }
        }
    }

    const profilePreview = document.getElementById('nav-profile-preview');
    const authBtn = document.getElementById('nav-auth-btn');

    if (session?.user) {
        if (profilePreview) profilePreview.classList.remove('hidden');
        if (authBtn) {
            authBtn.classList.add('hidden');
            authBtn.classList.remove('flex');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, role, photo_url')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            const nameEl = document.getElementById('nav-user-name');
            const roleEl = document.getElementById('nav-user-role');
            const photoEl = document.getElementById('nav-user-photo');

            if (nameEl) nameEl.textContent = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
            if (roleEl) roleEl.textContent = profile.role || 'Student';
            if (photoEl && profile.photo_url) {
                photoEl.style.backgroundImage = `url('${profile.photo_url}')`;
                photoEl.innerHTML = '';
            }
        }

        // DISPATCH SHARED EVENT for SideMenu and other components
        document.dispatchEvent(new CustomEvent('neurosync:auth-update', {
            detail: { session, supabase }
        }));
    } else {
        if (profilePreview) profilePreview.classList.add('hidden');
        if (authBtn) {
            authBtn.classList.remove('hidden');
            authBtn.classList.add('flex');
        }
    }
}

function setupThemeToggle() {
    const btn = document.getElementById('nav-theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';

        // This relies on theme.js expose functions or just manipulating classes
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.body.classList.remove('light');
            btn.querySelector('span').textContent = 'dark_mode';
        } else {
            document.documentElement.classList.add('light');
            document.body.classList.add('light');
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            btn.querySelector('span').textContent = 'light_mode';
        }
        localStorage.setItem('theme', newTheme);
    });

    // Initial icon state
    const saved = localStorage.getItem('theme') || 'dark';
    if (btn.querySelector('span')) {
        btn.querySelector('span').textContent = saved === 'dark' ? 'dark_mode' : 'light_mode';
    }
}
