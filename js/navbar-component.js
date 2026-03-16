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
    // Root-relative paths for subdomain stability
    const pfx = '/';
    const htmlPfx = '/html/';

    const navbarHTML = `
        <header id="universal-navbar" class="fixed top-0 left-0 right-0 z-40 h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl">
            <div class="max-w-[1600px] mx-auto h-full px-6 flex items-center justify-between">
                <!-- Left: Branding & Site Trigger -->
                <div class="flex items-center gap-6">
                    <button id="mobile-menu-btn" class="hidden items-center justify-center p-2 -ml-2 hover:bg-white/5 transition-colors group">
                        <span class="material-symbols-outlined text-white/50 group-hover:text-red-500 transition-colors">menu</span>
                    </button>
                    <a href="${pfx}index.html" class="flex items-center gap-3 group">
                        <img src="${pfx}assets/Navbar_logo copy.png" alt="NeuroSync Logo" class="h-6 w-auto grayscale contrast-125 group-hover:grayscale-0 transition-all">
                        <span class="hidden md:block text-[10px] font-black tracking-[0.4em] uppercase text-white/30 group-hover:text-white transition-colors">NeuroSync // Horizon</span>
                    </a>
                </div>

                <!-- Center: Primary Navigation (Desktop) -->
                <nav class="hidden lg:flex items-center gap-8">
                    <a href="${htmlPfx}about.html" class="nav-link-std">About Us</a>
                    <!-- Auth-only links -->
                    <div id="nav-auth-links" class="hidden items-center gap-8">
                        <a href="${htmlPfx}dashboard.html" class="nav-link-std">Dashboard</a>
                        <a href="${htmlPfx}study-library.html" class="nav-link-std">Vault</a>
                        <a href="${htmlPfx}rewards.html" class="nav-link-std">Rewards</a>
                        <a href="${htmlPfx}profile.html" class="nav-link-std">Profile</a>
                    </div>
                </nav>

                <!-- Right: Profile & Controls -->
                <div class="flex items-center gap-4">
                    <!-- Theme Toggle -->
                    <button id="nav-theme-toggle" class="size-10 flex items-center justify-center border border-white/10 hover:border-red-500 transition-colors">
                        <span class="material-symbols-outlined text-sm text-white/50">dark_mode</span>
                    </button>

                    <!-- Notifications Dropdown (Auth only) -->
                    <div id="nav-notif-container" class="hidden relative">
                        <button id="nav-notif-btn" class="size-10 flex items-center justify-center border border-white/10 hover:border-red-500 transition-all relative group">
                            <span class="material-symbols-outlined text-sm text-white/50 group-hover:text-white transition-colors">notifications</span>
                            <!-- Unread Badge -->
                            <div id="nav-notif-badge" class="hidden absolute top-0 right-0 size-2 bg-red-600 border border-black animate-pulse"></div>
                        </button>

                        <!-- Notification Panel -->
                        <div id="nav-notif-panel" class="hidden absolute top-full right-0 mt-2 w-80 bg-black/95 border border-white/10 shadow-2xl backdrop-blur-3xl z-50 overflow-hidden">
                            <div class="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <span class="text-[9px] font-black uppercase tracking-widest text-white/40">Synchronization Alerts</span>
                                <button id="nav-notif-clear" class="text-[8px] font-bold text-red-500 hover:text-white uppercase tracking-tighter transition-colors">Clear All</button>
                            </div>
                            <div id="nav-notif-list" class="max-h-[400px] overflow-y-auto custom-scrollbar">
                                <div class="p-8 text-center text-[10px] text-white/20 uppercase tracking-widest italic">No Link Established</div>
                            </div>
                        </div>
                    </div>

                    <!-- Auth Action (Login/Connect if not logged in) -->
                    <a href="${htmlPfx}auth.html" id="nav-auth-btn" class="hidden h-10 px-6 items-center justify-center bg-red-600 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                        Connect
                    </a>

                    <!-- User Profile Box (Auth only) -->
                    <div id="nav-profile-box" class="hidden items-center gap-3 cursor-pointer group/nav-prof" onclick="window.location.href='${htmlPfx}profile.html'">
                        <div class="flex flex-col items-end">
                            <div id="nav-user-name" class="text-[9px] font-black text-white/90 uppercase tracking-widest group-hover/nav-prof:text-red-500 transition-colors">--</div>
                            <div id="nav-user-class" class="text-[7px] font-mono text-zinc-500 uppercase tracking-tighter">--</div>
                        </div>
                        <div id="nav-user-photo" class="size-10 border border-white/10 group-hover/nav-prof:border-red-500 transition-colors bg-cover bg-center flex items-center justify-center overflow-hidden">
                             <span class="material-symbols-outlined text-lg text-white/20">person</span>
                        </div>
                    </div>
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

                /* Notification styles */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 0;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #EF4444;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
    const importPath = '/js/supabase.js';
    import(importPath).then(({ supabase }) => {
        // Initial Session Check
        handleAuthState(null, null, supabase);

        supabase.auth.onAuthStateChange(async (event, session) => {
            handleAuthState(event, session, supabase);
            if (session?.user) {
                initNotifications(supabase, session.user);
            }
        });

        // If already logged in on load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                initNotifications(supabase, session.user);
            }
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

    const authBtn = document.getElementById('nav-auth-btn');
    const authLinks = document.getElementById('nav-auth-links');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const profileBox = document.getElementById('nav-profile-box');
    const notifContainer = document.getElementById('nav-notif-container');

    if (session?.user) {
        if (authBtn) {
            authBtn.classList.add('hidden');
            authBtn.classList.remove('flex');
        }
        if (authLinks) {
            authLinks.classList.remove('hidden');
            authLinks.classList.add('flex');
        }
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('hidden');
            mobileMenuBtn.classList.add('flex');
        }
        if (profileBox) {
            profileBox.classList.remove('hidden');
            profileBox.classList.add('flex');
            syncNavbarProfile(supabase, session.user);
        }
        if (notifContainer) {
            notifContainer.classList.remove('hidden');
            notifContainer.classList.add('block');
        }

        // DISPATCH SHARED EVENT for SideMenu and other components
        document.dispatchEvent(new CustomEvent('neurosync:auth-update', {
            detail: { session, supabase }
        }));
    } else {
        if (authBtn) {
            authBtn.classList.remove('hidden');
            authBtn.classList.add('flex');
        }
        if (authLinks) {
            authLinks.classList.add('hidden');
            authLinks.classList.remove('flex');
        }
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.add('hidden');
            mobileMenuBtn.classList.remove('flex');
        }
        if (profileBox) {
            profileBox.classList.add('hidden');
            profileBox.classList.remove('flex');
        }
        if (notifContainer) {
            notifContainer.classList.add('hidden');
            notifContainer.classList.remove('block');
        }
    }
}

// ============ NOTIFICATION ENGINE ============

let notifSubscription = null;

function initNotifications(supabase, user) {
    const btn = document.getElementById('nav-notif-btn');
    const panel = document.getElementById('nav-notif-panel');
    const clearBtn = document.getElementById('nav-notif-clear');

    if (!btn || !panel) return;

    // Toggle Panel
    btn.onclick = (e) => {
        e.stopPropagation();
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            syncNotifications(supabase, user);
        }
    };

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });

    // Clear All
    if (clearBtn) {
        clearBtn.onclick = async () => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            
            if (!error) syncNotifications(supabase, user);
        };
    }

    // Initial Sync
    syncNotifications(supabase, user);
    setupNotificationRealtime(supabase, user);
}

async function syncNotifications(supabase, user) {
    const list = document.getElementById('nav-notif-list');
    const badge = document.getElementById('nav-notif-badge');
    if (!list) return;

    const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('[Notifications] Sync error:', error);
        return;
    }

    // Update Badge
    const unreadCount = notifs.filter(n => !n.is_read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Render List
    if (notifs.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-[10px] text-white/20 uppercase tracking-widest italic">No Link Established</div>';
        return;
    }

    list.innerHTML = notifs.map(n => `
        <div class="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group/notif ${n.is_read ? 'opacity-50' : ''}" onclick="window.markNotifRead('${n.id}')">
            <div class="flex justify-between items-start mb-1">
                <span class="text-[8px] font-black uppercase tracking-tighter ${n.type === 'approval' ? 'text-green-500' : n.type === 'rejection' ? 'text-red-500' : 'text-blue-500'}">${n.type || 'SYSTEM'} // ALERT</span>
                <span class="text-[7px] font-mono text-white/20 uppercase">${new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <p class="text-[10px] text-zinc-400 group-hover/notif:text-white transition-colors leading-relaxed">${n.message}</p>
        </div>
    `).join('');

    // Attach read handler to window for inline onclick
    window.markNotifRead = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        
        if (!error) syncNotifications(supabase, user);
    };
}

function setupNotificationRealtime(supabase, user) {
    if (notifSubscription) {
        supabase.removeChannel(notifSubscription);
    }

    notifSubscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
        }, (payload) => {
            console.log('[Notifications] New Alert Received:', payload);
            syncNotifications(supabase, user);
            // Optional: Play subtle sound or show browser notification
        })
        .subscribe();
}

async function syncNavbarProfile(supabase, user) {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, class_grade, photo_url')
            .eq('id', user.id)
            .single();

        if (profile) {
            const nameEl = document.getElementById('nav-user-name');
            const classEl = document.getElementById('nav-user-class');
            const photoEl = document.getElementById('nav-user-photo');

            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email.split('@')[0];
            if (nameEl) nameEl.textContent = fullName;
            if (classEl) classEl.textContent = profile.class_grade || 'New Student';
            
            if (photoEl) {
                if (profile.photo_url) {
                    photoEl.style.backgroundImage = `url("${profile.photo_url}")`;
                    photoEl.innerHTML = '';
                } else {
                    photoEl.style.backgroundImage = 'none';
                    photoEl.innerHTML = '<span class="material-symbols-outlined text-lg text-white/20">person</span>';
                }
            }
        }
    } catch (err) {
        console.warn('[Navbar] Profile sync error:', err.message);
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
